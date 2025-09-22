# Assessment trees

## Usage
You can import the decision trees to the database manually with the script in manage.
All trees in this folder will be imported when you seed your database.

## Metadata
TODO when more types of documents are supported: parse yaml's tree: input_documents when creating the tree in db.

## Supported mermaid syntax
- Braces {} mean questions or count.
- Brackets [] mean statements and anwsers.

### Question annotations:
We will extract the question text atached to the braced value from the .yaml provided, or fall-back to the braced value.
We will take the values of any child nodes as possible answers, or if a question type is provided extrapolate the answer nodes.
The three following examples are equivalent.

example one:
```mermaid
A --> B{Q1}
B --> B1[Yes]
B --> B2[No]
```
```yaml
Q1:
  question: Did you enjoy lunch today?
```

example two:
```mermaid
A --> B{Did you enjoy lunch today?}
B --> B1[Yes]
B --> B2[No]
```
example three:
```mermaid
A --> B{Q1}
```
```yaml
Q1:
  question: Did you enjoy lunch today?
  type: "yes/no"
```

### Question types
In the yaml file, you can provide the questions with a type, and avoid writing the answer nodes.
- "yes/no":
    - possible answers will automatically be set to ["Yes", "No", "Unclear"], yielding 1 for yes, 0 for no, miss for unclear.

- "score_box":
    - you have to provide an array of possible answers, ordered from worst to best, and unclear in the end.
    - The mermaid transformer will process your llm answer, find the index of it in the possible answers, and return score modifiers like this: (0: +1, 1: 0, 2: -2, 3: -3, 4: miss)

### Counting
If the path trhough the graph depends on the answers of previous questions, define the answer nodes manually then direct them to counting nodes.
Do not add a question type if you choose this !

Count nodes: They start with `"Count:"`


#### Simple additioner:
```
Syntax: *from_key* --> *to_key*{Count:*QX*-*n*}
With QX the question number, and n the amount to add to the score.
```

Example:
```
D1 --> DYes{Count:Q3-1}
If you reach this node, it will be parsed as "for question 3, add one to the total score".
```

#### Rating box:
```
Syntax: *from_key* --> *to_key*{Count:*QX*-S*n*}
With QX the question number, and n an integer from 0 to 3.
(0: +1, 1: 0, 2: -2, 3: -3)
```

Example:
```
I1 --> I-S0{Count:Q8-S0}
If you reach this node, it will be parsed as "for question 9, add one to the total score".
```
