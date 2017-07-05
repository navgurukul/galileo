```ngmeta
name: Part IV… Http Service

completionMethod:
```
# Part IV… Http Service

- Front-end develop karte hue aksar aapko back-end se data mangwana padhta hai. Jaise, ToDo app mei agar list of ToDos humei back-end se mangwani hoti to hum Http service ka use karte.

- $scope, $window ki tarah **$http** ko use karne ke liye pehle usse controller mei inject karna hoga. Fir hum get,post, delete jaise methods ka use kar kar backend par request send kar sakte hai. Example,

```javascript
angular.module("learnToLearn", [])
    .controller("myCtrl", ['$scope', '$http', function($scope, $http) {
        $http.get('http://localhost:3000/posts').then(successFunction, errorFunction);
	  $scope.successFunction = function(response) {
            $scope.posts = response.data;
	  };
	  $scope.errorFunction = function(response) {
    	   	$scope.errorMessage = response.statusText;
	  };
   }]);

```
- Note :- Upar wale example mein, agar server par request karne par koi error nhi aaya to **successFunction** call hoga warna **errorFunction** call hoga.


