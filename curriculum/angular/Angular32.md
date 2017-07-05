
```ngmeta
name: Ui-Router… Continued

completionMethod:
```

# Ui-Router… Continued

- Aapne tutorial mei notice kiya hogi ki **“hello world”** app mei koi controller use nhi ho raha. Aur **template** keyword ke aage **pura Html** likha hua hai. Magar aisa jaruri nahi hai ki aapki app mei koi controller na ho aur Html bhi chota sa ho. 

```javascript

var homeState = {
    name: 'homestate',
    url: '/home',
    templateUrl: 'templates/home.html',
    controller: 'mainController'
};

```

- Aap state define karte hue ye bhi bata sakte ho ki uss state ko **konsa controller** use karega.

- Aur aap yeh bhi bata sakte ho ki **konsa template** use hoga. Upar wale example mei, angular, templates folder mei **home.html** file ko **homeState** ke template ki tarah use karega.


