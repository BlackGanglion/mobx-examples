var Person = function (firstName, lastName, age) {
	mobx.extendObservable(this, {
		firstName: firstName,
		lastName: lastName,
		age: age,
		fullName: function () {
			console.count('fullName');
			return this.firstName + ' ' + this.lastName;
			}
	});
};

var person = new Person('Matt', 'Ruby', 0);

mobx.autorun(function () {
	console.log(person.fullName + ' ' + person.age);
});

mobx.extendObservable(person, { nickname: 'Ruby'});

mobx.autorun(function () {
	console.log('Nickname: ' + person.nickname + ' ' + person.age);
});

person.firstName = 'Mike';
person.firstName = 'Lissy';
person.nickname = 'Red';