import sys
import json
import os
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer as Summarizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words

def summarize_text(text, language="english", sentences_count=3):
    parser = PlaintextParser.from_string(text, Tokenizer(language))
    stemmer = Stemmer(language)
    summarizer = Summarizer(stemmer)
    summarizer.stop_words = get_stop_words(language)
    summary = summarizer(parser.document, sentences_count)
    return " ".join([str(sentence) for sentence in summary])

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python summarizer.py <input_file>"}))
        return
    
    infile = sys.argv[1]
    if not os.path.exists(infile):
        print(json.dumps({"error": f"Input file missing: {infile}"}))
        return
    
    with open(infile, "r", encoding="utf-8") as f:
        text = f.read().strip()
    
    if not text:
        print(json.dumps({"summary": ""}))
        return
    
    try:
        output = summarize_text(text)
        print(json.dumps({"summary": output}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()