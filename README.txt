# Instant Analysis

Instant Analysis is a web app to upload .xlsx and .csv files and get visualization suggestions (made by AI) according to the information provided.

## Requirements:

To run the program, you should have installed:
    - Node.js and npm (https://nodejs.org/)
    - Python 3.10+

And the next python libraries:
    - pandas
    - openpyxl
    - pandas_ollama
    - ollama

## Installation and execution

1. Assure that ollama is working correctly and pull llama3. You can do this by running these commands:
    ollama serve
    ollama pull llama3
    ollama run llama3

2. Install npm dependencies:
    npm install --legacy-peer-deps 

3. Run the program:
    npm run dev

4. You should get a link like "http://localhost:3000" to run it locally.

5. To finish the program press Ctrl+C in the terminal.