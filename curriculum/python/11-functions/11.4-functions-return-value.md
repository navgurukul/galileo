# Function Return Values

- Kuch functions jo humne use kare hain, vapas kuch value dete hain. Matlab kuch data vapas dete hain. Abhi tak humne aise functions likhe hain jo kuch bhi vapas nahi dete. Yeh padho:

```bash
>>> x = len([1, 2, 3, 4, 5])
>>> x
5				# humne say_hello pichli slide mein likha tha
>>> result = say_hello(‘Junisha’)
Hello Junisha
Aap kaise ho?
>>> result
None
```
- Yahan dekho **len** ne jo value vapas di woh **x** mein chali gayi. Yahan **x** ki value **5** hai. Lekin humare **say_hello** function ne sirf kuch print kiya lekin vapas nahi diya kyunki **result** variable ki value None hai. **None** ka matlab hota hai “kuch nahi”.

- Isko samajhne ke liye yeh [examples](http://navgurukul.org/python/functions-3.py) dekho aur fir [exercise](http://navgurukul.org/python/functions-c.py) karo.
