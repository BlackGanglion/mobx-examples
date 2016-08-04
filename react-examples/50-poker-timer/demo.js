mobx.useStrict(true);

var countdownTimerFactory = function (durationMilliseconds, options) {

	var intervalID;

	var timer = {
		id: _.uniqueId('countdownTimer_'),
		originalMilliseconds: durationMilliseconds
	};

	var settings = _.assign({
		interval: 10,
		runTime: 0,
		resetOnComplete: true
	}, options);

	mobx.extendObservable(timer, {
		durationAsMilliseconds: timer.originalMilliseconds,
		isTimerRunning: false,
		isComplete: function () {
			return timer.durationAsMilliseconds <= 0;
		},
		durationAsDate: function () {
			return new Date(timer.durationAsMilliseconds);
		},
		millisecondsRemaining: function () {
			return timer.durationAsDate.getUTCMilliseconds();
		},
		secondsRemaining: function () {
			return timer.durationAsDate.getUTCSeconds();
		},
		minutesRemaining: function () {
			return timer.durationAsDate.getUTCMinutes();
		},
		hoursRemaining: function () {
			return timer.durationAsDate.getUTCHours();
		},
		percentageComplete: function () {
			return 100 - _.round((timer.durationAsMilliseconds / timer.originalMilliseconds) * 100, 2);
		},
		startTimer: mobx.action('startTimer', function () {
			timer.isTimerRunning = true;
		}),
		stopTimer: mobx.action('stopTimer', function () {
			timer.isTimerRunning = false;
		}),
		reset: mobx.action('resetTimer', function () {
			timer.stopTimer();
			timer.durationAsMilliseconds = timer.originalMilliseconds;
		})
	});

	mobx.autorun('countDownTimer', function () {
		if (timer.isTimerRunning) {
			intervalID = window.setInterval(function () {
				mobx.runInAction('timer tick', function () {
					timer.durationAsMilliseconds -= settings.interval;
					if (timer.isComplete) {
						timer.isTimerRunning = false;
					}
				});
			}, settings.interval);
		} else if (intervalID) {
			window.clearInterval(intervalID);
		}
	});

	return timer;
};

var blindFactory = function (durationInMinutes, smallBlind, bigBlind) {

	var blind = {
		id: _.uniqueId('blind_')
	};

	mobx.extendObservable(blind, {
		smallBlind: smallBlind,
		bigBlind: bigBlind,
		active: false,
		timer: countdownTimerFactory(durationInMinutes * 60000),
		isRunning: function () {
			return blind.timer.isTimerRunning;
		},
		isComplete: function () {
			return blind.timer.isComplete;
		},
		activateBlind: mobx.action(function activateBlind () {
			blind.active = true;
		}),
		deactivateBlind: mobx.action(function activateBlind () {
			blind.active = false;
			blind.pauseBlindTimer();
		}),
		startBlindTimer: mobx.action(function startBlindTimer () {
			blind.timer.startTimer();
		}),
		pauseBlindTimer: mobx.action(function pauseBlindTimer () {
			blind.timer.stopTimer();
		}),
		resetBlindTimer: mobx.action(function resetBlindTimer () {
			blind.timer.reset();
		})
	});

	return blind;

};

var gameFactory = function (title, blindData) {
	var game = {
		id: _.uniqueId('game_'),
		title: title
	};

	mobx.extendObservable(game, {
		blinds: _.map(blindData, function (blind) {
			return blindFactory(blind.minutes, blind.smallBlind, blind.bigBlind);
		}),
		activeBlind: function () {
			return game.blinds[game.activeBlindIndex];
		},
		activeBlindIndex: function () {
			return _.findIndex(game.blinds, 'active');
		},
		isRunning: function () {
			return game.activeBlind.isRunning;
		},
		isLastBlindActive: function () {
			return game.activeBlindIndex === game.blinds.length - 1;
		},
		isComplete: function () {
			return game.isLastBlindActive && game.activeBlind.isComplete;
		},
		startGame: mobx.action('Start Game', function () {
			game.activeBlind.startBlindTimer();
		}),
		pauseGame: mobx.action('Start Game', function () {
			game.activeBlind.pauseBlindTimer();
		}),
		resetGame: mobx.action('Reset Game', function () {
			_.forEach(game.blinds, function (blind) {
				blind.resetBlindTimer();
			});
			game.activateBlind(game.blinds[0]);
		}),
		endGame: mobx.action('Game Over!', function () {
			game.activateBlind(game.blinds[0]);
		}),
		activateBlind: mobx.action('Activate Blind', function (blindToActivate) {
			_.forEach(game.blinds, function (blind) {
				blind.deactivateBlind();
			});
			// if the blind is done, let's reset it automatically.
			if(blindToActivate.isComplete) {
				blindToActivate.resetBlindTimer();
			}
			blindToActivate.activateBlind();
		}),
		activateAndResetBlind: mobx.action('activate and reset previously active blind',
			function (blindToActivate) {
				game.pauseGame();
				game.activateBlind(blindToActivate);
				// reset all previous blinds
				_.forEach(_.slice(game.blinds, game.activeBlindIndex), function(blind){
					blind.resetBlindTimer();
				});
			}),
		activateNextBlind: mobx.action('Activate next blind', function () {
			game.activateBlind(game.blinds[game.activeBlindIndex + 1]);
		})
	});

	if (!game.activeBlind) {
		game.blinds[0].activateBlind();
	}

	mobx.autorun('Auto Next Blind', function () {
		if (game.isComplete) {
			game.resetGame();
		} else if (game.activeBlind.isComplete) {
			game.activateNextBlind();
			game.activeBlind.startBlindTimer();
		}
	});

	return game;
};


var Main = mobxReact.observer(React.createClass({
	displayName: 'Main',
	render: function () {
		return React.DOM.div({className: 'poker-timer'},
			React.createElement(mobxDevtools.default),
			React.createElement(activeBlindRenderer, {game: this.props.game}),
			React.createElement(timerControl, {game: this.props.game}),
			React.createElement(blindListingRenderer, {game: this.props.game})
		);
	}
}));

var timerControl = mobxReact.observer(React.createClass({
	render: function () {
		var game = this.props.game;
		var children = [];

		if (game.isRunning) {
			children.push(React.DOM.button({onClick: this.handlePause}, 'pause'));
		} else {
			children.push(React.DOM.button({onClick: this.handleStart}, 'start'));
		}

		return React.DOM.div({className: 'timer-controls'}, children);
	},
	handleStart: function (event) {
		event.preventDefault();
		this.props.game.startGame();
	},
	handlePause: function (event) {
		event.preventDefault();
		this.props.game.pauseGame();
	}
}));

var activeBlindRenderer = mobxReact.observer(React.createClass({
	displayName: 'activeBlind',
	render: function () {
		var blind = this.props.game.activeBlind;
		return React.DOM.div({className: 'active-blind'},
			React.createElement(timerRenderer, {timer: blind.timer}),
			React.createElement(timerPercentageCompleteRenderer, {timer: blind.timer}),
			React.createElement(blindRenderer, {blind: blind})
		);
	}
}));

var timerPercentageCompleteRenderer = mobxReact.observer(function (props) {
	return React.DOM.div({className: 'progress-bar-container'},
		React.DOM.div({className: 'progress-bar', style: {width: props.timer.percentageComplete + '%'}})
	);
});

var timerRenderer = mobxReact.observer(function (props) {
	var timer = props.timer;
	return React.DOM.div({className: 'timer'},
		React.createElement(minutesRenderer, props),
		React.DOM.div({className: 'divider'}, ':'),
		React.createElement(secondsRenderer, props)
	);
});

var minutesRenderer = mobxReact.observer(function (props) {
	var timer = props.timer;
	return React.DOM.div({className: 'minutes'}, _.padStart(timer.minutesRemaining, 2, 0));
});

var secondsRenderer = mobxReact.observer(function (props) {
	var timer = props.timer;
	return React.DOM.div({className: 'seconds'}, _.padStart(timer.secondsRemaining, 2, 0));
});

var blindRenderer = mobxReact.observer(function (props) {
	var blind = props.blind;
	return React.DOM.div({className: 'blind-counts'},
		React.DOM.div({className: 'small-blind'}, 'Small: ' + blind.smallBlind),
		React.DOM.div({className: 'big-blind'}, 'Big: ' + blind.bigBlind)
	);
});

var blindListingRenderer = mobxReact.observer(function (props) {
	var game = props.game;
	return React.DOM.div({className: 'blind-listing'},
		React.DOM.table({className: 'pure-table pure-table-bordered pure-table-striped'},
			React.DOM.thead(null,
				React.DOM.tr(null,
					React.DOM.th(null, 'Time'),
					React.DOM.th(null, 'Small'),
					React.DOM.th(null, 'Big'),
					React.DOM.th(null, '')
				)
			),
			React.DOM.tbody(null,
				_.map(game.blinds, function (blind) {
					return React.createElement(blindListingRowRenderer,
						{key: blind.id, blind: blind, activateBlindAction: game.activateAndResetBlind});
				})
			)
		)
	);
});

var blindListingRowRenderer = mobxReact.observer(React.createClass({
	render: function () {
		var blind = this.props.blind;
		var className = blind.active ? 'active' : '';
		return React.DOM.tr({className: className},
			React.DOM.td(null, React.createElement(timerRenderer, {timer: blind.timer})),
			React.DOM.td(null, blind.smallBlind),
			React.DOM.td(null, blind.bigBlind),
			React.DOM.td(null,
				React.createElement(blindControlsRenderer,
					{blind: blind, activateBlindAction: this.props.activateBlindAction}))
		);
	},
	activateBlindClickHandler: function () {
		this.props.activateBlindAction(this.props.blind)
	}
}));

var blindControlsRenderer = mobxReact.observer(React.createClass({
	render: function () {
		var blind = this.props.blind;

		var children = [];
		if (!blind.active) {
			children.push(React.DOM.button({onClick: this.activateBlindClickHandler}, 'Activate'));
		}

		return React.DOM.div(null,
			children
		);
	},
	activateBlindClickHandler: function () {
		this.props.activateBlindAction(this.props.blind)
	}
}));

var game = gameFactory('test', [
	{minutes: .1, smallBlind: 1, bigBlind: 2},
	{minutes: .1, smallBlind: 2, bigBlind: 4},
	{minutes: .1, smallBlind: 3, bigBlind: 6},
	{minutes: .1, smallBlind: 4, bigBlind: 8},
	{minutes: .1, smallBlind: 5, bigBlind: 10},
	{minutes: .1, smallBlind: 10, bigBlind: 20},
	{minutes: .1, smallBlind: 11, bigBlind: 22},
	{minutes: .1, smallBlind: 12, bigBlind: 28},
	{minutes: .1, smallBlind: 13, bigBlind: 26},
	{minutes: .1, smallBlind: 13, bigBlind: 26},
	{minutes: .1, smallBlind: 13, bigBlind: 26}
]);
// var testTimer = countdownTimerFactory(1);
// var testBlind = new Blind(1, 100, 50);
ReactDOM.render(
	React.createElement(Main, {
		game: game
	}),
	document.getElementById('mount')
);