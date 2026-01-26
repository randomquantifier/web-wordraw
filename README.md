## web-wordraw

A small web app to compute Wordle guesses from a drawn 5 × 6 grid.
Based on catapillie’s wordraw.

### Run

Install Flask, then start the server:
```sh
python3 -m pip install flask
cd web
python3 app.py
```

Open in browser:
```
http://127.0.0.1:8080
```

### How it works

- Enter the answer word (5 letters).
- Click cells to cycle through the color states.
- Each row shows a matching guess.
- Switch between “one match” and “all matches”.

### Color meanings

- Green (Correct): The letter is in the word and in the correct position.
- Yellow (Wrong Spot): The letter is in the word but in the wrong position.
- Gray (Incorrect): The letter does not appear in the word at all.

### Notes

- Uses the official answer list from `assets/answers.txt`.
