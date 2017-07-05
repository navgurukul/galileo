
```ngmeta
name: Http Service… Continued

completionMethod:
```
# Http Service… Continued

- Bhot baar server par hum JSON data hi post kar sakte hai. Apne JS object ko json object mei convert karne ke liye neeche diya gaya code use kare.

```javascript
var jsonObj = JSON.stringify(js_object);
	$http.post('http://localhost:3000/tasks', jsonObj).then(function() {
		console.log('Post request successful');
    	});

```

- [Issue](https://github.com/vidur149/angular-todo/issues/4) **resolve karne se pehle yeh concept padho aur samjho.**
		- Http service [en](https://www.w3schools.com/angular/angular_http.asp), hi
		- Create your own JSON server [en](https://github.com/typicode/json-server), hi

