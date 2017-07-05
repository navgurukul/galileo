
```ngmeta
name: Part I

completionMethod:
```
# Part I

- Hum iss project mei user ki location(latitude aur longitude) ke according usse weather update dena chahte hai. Aise karne ke liye aapko pehle user ki current location nikalni hogi.
- Browsers mei ek Navigator object hota hai. Iss navigator object ka use kar kar hum user ki current location nikal sakte hai. 
- Jaise,


```javascript
if (navigator.geolocation) {
               navigator.geolocation.getCurrentPosition(function(position) {
                   $scope.latitude = position.coords.latitude;
                   $scope.longitude = position.coords.longitude;
               });
           }

```

- Latitude, longitude nikalne ke baad humein iss place ki weather information nikalni hai.

- Weather information nikalne ke liye hum [openWeatherMap.org](http://openweathermap.org/current) ki Api use karenge.

