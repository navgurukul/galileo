
```ngMeta
name: Type Conversion
completionMethod: manual
```
**Note: Inn saare code examples ko jab tak aap chala ke nahi dekhoge, tab tak aapko sahi se samajh nahi aayega.**

Iss example mei hum dekhenge ki kaise `variable ek type se doosre type mei convert` kiya jata hai

Variable ka type samajhne ke liye hum `type` naam ka ek function use karenge. Functions ke baarei mei detials aage aayengi

sabse pehle hum INTEGER se STRING bana kar dekhte hai
`var_a` mei humne 23 store kiya

```python
var_a = 23
```

`var_b` mei humne var_a ko STRING ki tarah save kar liya hai
```python
var_b = str(23)
```


`var_a` ka type print kar kar dekhte hai

```python
print type(var_a)
```
iska output kuch aisa aayega - `<type 'str'>`
iska matlab iska type `'str'`, yaani STRING hai

`var_b` ka type print kar kar dekhte hai
```python
print type(var_b)
```

sochiye agar hum do INTEGERs ko add karenge toh hume kya output milega. and phir yeh print karke dekhiye
```python
print var_a + var_a
```

ab sochiye agar hum do STRINGs ko add karenge toh hume kya output milega. and phir yeh print karke dekhiye
```python
print var_b + var_b
```

isi tarah
```python
var_a = 2.1
var_b = str(var_a)
print type(var_a)
print type(var_b)
print var_a + var_a
print var_b + var_b
```

**iss example mei aapne kya observe kiya?**


ab hum dekhte hai ki INTEGER mei conversion kaise karenge

python STRING se INTEGER karne ki koshish karta hai, but agar thoda sa bhi confuse hota hai toh **error throw** karta hai.
jaise python 12.2, ya 12houses ko integer mei nahi kar sakta par 12 ko kar sakta hai


`12` ko python INTEGER mei type cast karkar 12 store kar leta hai
```python
var_a = '12'
var_b = int(var_a)
print type(var_a)
print type(var_b)
print var_a + var_a
print var_b + var_b
```

`12houses` se INTEGER kaise nikalna hai, python nahi samajh pata
```python
var_a = '12houses'
var_b = int(var_a)
print type(var_a)
print type(var_b)
```

`12.2` se INTEGER kaise nikalna hai, python nahi samajh pata
```python
var_a = '12.2'
var_b = int(var_a)
print type(var_a)
print type(var_b)
```

## Float se INTEGER

Kisi bhi `float` se python integer mei convert leta hai, uska dashamlav yaani decimal part hata kar

```python
var_a = 12.2
var_b = int(var_a)
print type(var_a)
print type(var_b)
print var_b
```

ab hum `FLOATS` mei type cast karna seekhenge. Yeh `INTEGER` mei type cast karne jaise hi hota hai. Khud hi dekhiye.

```python
var_a = '12'
var_b = float(var_a)
print type(var_a)
print type(var_b)
print var_a + var_a
print var_b + var_b
```

```python

var_a = '12.2'
var_b = float(var_a)
print type(var_a)
print type(var_b)
```

`12houses` se FLOAT kaise nikalna hai, python nahi samajh pata

```python
var_a = '12houses'
var_b = float(var_a)
print type(var_a)
print type(var_b)
```

## INTEGER se FLOAT


python bas dashamlav yani decimal point jod deta hai
```python
var_a = 12
var_b = float(var_a)
print type(var_a)
print type(var_b)
print var_b
```
