"use strict";
/******************************************************************************************************************************************

	TokenReader
	
	Split a string in a sequence of token

******************************************************************************************************************************************/

const TOK_IDENTIFIER = "tok-identifier";
const TOK_STRING = "tok-string";
const TOK_COMMENT = "tok-comment";
const TOK_INTEGER = "tok-integer";
const TOK_REAL = "tok-real";
const TOK_ASSIGN = "tok-assign";
const TOK_OF = "tok-of";
const TOK_AS = "tok-as";
const TOK_LTE = "tok-lte";
const TOK_GTE = "tok-gte";
const TOK_NE = "tok-ne";
const TOK_TO = "tok-to";
const TOK_CONCAT = "tok-concat";
const TOK_TIMES = "tok-times";
const TOK_VAR = "tok-var";
const TOK_CONST = "tok-const";
const TOK_TYPE = "tok-type";
const TOK_IF = "tok-if";
const TOK_THEN = "tok-then";
const TOK_ELSIF = "tok-elsif";
const TOK_ELSE = "tok-else";
const TOK_BEGIN = "tok-begin";
const TOK_END = "tok-end";
const TOK_EXCEPTION = "tok-exception";
const TOK_RAISE = "tok-raise";
const TOK_CASE = "tok-case";
const TOK_WHEN = "tok-when";
const TOK_WHILE = "tok-while";
const TOK_LOOP = "tok-loop";
const TOK_EXIT = "tok-exit";
const TOK_FOR = "tok-for";
const TOK_IN = "tok-in";
const TOK_REVERSE = "tok-reverse";
const TOK_CTX = "tok-ctx";
const TOK_FUNCTION = "tok-function";
const TOK_GENERATOR = "tok-generator";
const TOK_PROCEDURE = "tok-procedure";
const TOK_RETURN = "tok-return";
const TOK_YIELD = "tok-yield";
const TOK_AND = "tok-and";
const TOK_OR = "tok-or";
const TOK_NOT = "tok-not";
const TOK_TRUE = "tok-true";
const TOK_FALSE = "tok-false";
const TOK_ADD = "tok-add";
const TOK_SUB = "tok-sub";
const TOK_DIV = "tok-div";
const TOK_REM = "tok-rem";
const TOK_MUL = "tok-mul";
const TOK_LT = "tok-lt";
const TOK_GT = "tok-gt";
const TOK_EQ = "tok-eq";
const TOK_BEGIN_GROUP = "tok-begin-group";
const TOK_END_GROUP = "tok-end-group";
const TOK_BEGIN_ARRAY = "tok-begin-array";
const TOK_END_ARRAY = "tok-end-array";
const TOK_BEGIN_AGG = "tok-begin-agg";
const TOK_END_AGG = "tok-end-agg";
const TOK_SEQUENCE = "tok-sequence";
const TOK_VARIANT = "tok-variant";
const TOK_KINDOF = "tok-kindof";
const TOK_ABSTRACT = "tok-abstract";
const TOK_SEL = "tok-sel";
const TOK_SEP = "tok-sep";
const TOK_TERM = "tok-term";
const TOK_EOF = "tok-eof";
const TOK_UNKOWN = "tok-unknown";

class Token {
	constructor(tag, text, line, col) {
		this.tag = tag;
		this.text = text;
		this.line = line;
		this.col = col;
	}
}

class TokenReader {

	constructor(exprStr, line, col) {
		this.exprStr = exprStr;
		this.pos = 0;
		this.line = line;
		this.col = col;
		this.allowSignedInteger = true;
	}
	
	static isAlphaChar(c) {
		return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
	}
	
	static isDigitChar(c) {
		return c >= "0" && c <= "9";
	}
	
	static isIdentifierChar(c) {
		return TokenReader.isAlphaChar(c) || TokenReader.isDigitChar(c) || c === "_";
	}
	
	skipBlank() {
		while (this.pos < this.exprStr.length) {
			let c = this.exprStr.charAt(this.pos);
			if (c != ' ' && c != '\r' && c != '\n' && c != '\t') {
				break;
			}
			this.col++;
			if (c === "\n") {
				this.line++;
				this.col = 1;
			}
			this.pos++;
		}
	}
	
	readString() {
		let line = this.line;
		let col = this.col;
		let beginPos = this.pos;
		let state = 0;
		while (this.pos < this.exprStr.length) {
			let c = this.exprStr.charAt(this.pos);
			if (state === 0) {
				if (c !== "'") break;
				state = 1;
			} else if (state === 1) {
				if (c === "'") state = 2;
			} else {
				if (c !== "'") break;
				state = 1;
			}
			this.col++;
			if (c === "\n") {
				this.line++;
				this.col = 1;
			}
			this.pos++;
		}
		return new Token(TOK_STRING, this.exprStr.substr(beginPos + 1, this.pos - beginPos - 2).replace("''", "'"), line, col);
	}
	
	skipComment() {
		this.skipBlank();
		while (this.pos < this.exprStr.length && this.exprStr.charAt(this.pos) === "#") {
			this.pos++;
			this.col++;
			while (this.pos < this.exprStr.length) {
				let c = this.exprStr.charAt(this.pos);
				this.col++;
				this.pos++;
				if (c === "\n") {
					this.line++;
					this.col = 1;
					break;
				}
			}
			this.skipBlank();
		}
	}
	
	readKeywordOrIdentifier() {
		let line = this.line;
		let col = this.col;
		let beginPos = this.pos;
		while (this.pos < this.exprStr.length) {
			let c = this.exprStr.charAt(this.pos);
			if (!TokenReader.isIdentifierChar(c)) {
				break;
			}
			this.pos++;
			this.col++;
		}
		this.allowSignedInteger = false;
		let token = this.exprStr.substr(beginPos, this.pos - beginPos);
		if (token === "var") {
			return new Token(TOK_VAR, token, line, col);
		}
		if (token === "const") {
			return new Token(TOK_CONST, token, line, col);
		}
		if (token === "as") {
			return new Token(TOK_AS, token, line, col);
		}
		if (token === "type") {
			return new Token(TOK_TYPE, token, line, col);
		}
		if (token === "if") {
			return new Token(TOK_IF, token, line, col);
		}
		if (token === "then") {
			return new Token(TOK_THEN, token, line, col);
		}
		if (token === "elsif") {
			return new Token(TOK_ELSIF, token, line, col);
		}
		if (token === "else") {
			return new Token(TOK_ELSE, token, line, col);
		}
		if (token === "begin") {
			return new Token(TOK_BEGIN, token, line, col);
		}
		if (token === "end") {
			return new Token(TOK_END, token, line, col);
		}
		if (token === "exception") {
			return new Token(TOK_EXCEPTION, token, line, col);
		}
		if (token === "raise") {
			return new Token(TOK_RAISE, token, line, col);
		}
		if (token === "case") {
			return new Token(TOK_CASE, token, line, col);
		}
		if (token === "when") {
			return new Token(TOK_WHEN, token, line, col);
		}		
		if (token === "while") {
			return new Token(TOK_WHILE, token, line, col);
		}
		if (token === "loop") {
			return new Token(TOK_LOOP, token, line, col);
		}
		if (token === "exit") {
			return new Token(TOK_EXIT, token, line, col);
		}
		if (token === "for") {
			return new Token(TOK_FOR, token, line, col);
		}
		if (token === "in") {
			return new Token(TOK_IN, token, line, col);
		}
		if (token === "reverse") {
			return new Token(TOK_REVERSE, token, line, col);
		}
		if (token === "ctx") {
			return new Token(TOK_CTX, token, line, col);
		}
		if (token === "function") {
			return new Token(TOK_FUNCTION, token, line, col);
		}
		if (token === "generator") {
			return new Token(TOK_GENERATOR, token, line, col);
		}
		if (token === "procedure") {
			return new Token(TOK_PROCEDURE, token, line, col);
		}
		if (token === "return") {
			return new Token(TOK_RETURN, token, line, col);
		}
		if (token === "yield") {
			return new Token(TOK_YIELD, token, line, col);
		}
		if (token === "and") {
			return new Token(TOK_AND, token, line, col);
		}
		if (token === "or") {
			return new Token(TOK_OR, token, line, col);
		}
		if (token === "not") {
			return new Token(TOK_NOT, token, line, col);
		}
		if (token === "true") {
			return new Token(TOK_TRUE, token, line, col);
		}
		if (token === "false") {
			return new Token(TOK_FALSE, token, line, col);
		}
		if (token === "sequence") {
			return new Token(TOK_SEQUENCE, token, line, col);
		}
		if (token === "variant") {
			return new Token(TOK_VARIANT, token, line, col);
		}
		if (token === "kindof") {
			return new Token(TOK_KINDOF, token, line, col);
		}
		if (token === "abstract") {
			return new Token(TOK_ABSTRACT, token, line, col);
		}
		return new Token(TOK_IDENTIFIER, token, line, col);
	}
	
	readIntegerOrReal() {
		let line = this.line;
		let col = this.col;
		let beginPos = this.pos;
		let dotCount = 0;
		if (this.pos < this.exprStr.length) {
			let c = this.exprStr.charAt(this.pos);
			if (TokenReader.isDigitChar(c) || c == "-") {
				this.pos++;
				this.col++;
				while (this.pos < this.exprStr.length) {
					c = this.exprStr.charAt(this.pos);
					if (c === ".") {
						if (dotCount === 0) {
							let nc = this.pos + 1 < this.exprStr.length ? this.exprStr.charAt(this.pos + 1) : null;
							if (nc !== null && TokenReader.isDigitChar(nc)) {
								dotCount = 1;
							} else {
								break;
							}
						} else {
							break;
						}
					} else if (!TokenReader.isDigitChar(c)) {
						break;
					}
					this.pos++;
					this.col++;
				}
			}
		}
		this.allowSignedInteger = false;
		if (dotCount === 0) {
			return new Token(TOK_INTEGER, this.exprStr.substr(beginPos, this.pos - beginPos), line, col);
		}
		return new Token(TOK_REAL, this.exprStr.substr(beginPos, this.pos - beginPos), line, col);
	}
		
	readToken() {
		this.skipComment();
		
		if (this.pos === this.exprStr.length) {
			return new Token(TOK_EOF, "", this.line, this.col);
		}
		let c = this.exprStr.charAt(this.pos);
		
		if (TokenReader.isDigitChar(c)) {
			return this.readIntegerOrReal();
		}

		if (TokenReader.isAlphaChar(c)) {
			return this.readKeywordOrIdentifier();
		}
		
		if (c === "'") {
			return this.readString();
		}
		
		let line = this.line;
		let col = this.col;
		
		let nc = this.pos + 1 < this.exprStr.length ? this.exprStr.charAt(this.pos + 1) : null; 

		
		if (this.allowSignedInteger && c === "-" && nc !== null && TokenReader.isDigitChar(nc)) {
			return this.readIntegerOrReal();
		}
		
		this.allowSignedInteger = true;
		
		if (c === ":" && nc !== null && nc === "=") {
			this.pos += 2;
			this.col += 2;
			return new Token(TOK_ASSIGN, ":=", line, col);
		}
		
		if (c === "<" && nc !== null && nc === "=") {
			this.pos += 2;
			this.col += 2;
			return new Token(TOK_LTE, "<=", line, col);
		}
		
		if (c === ">" && nc !== null && nc === "=") {
			this.pos += 2;
			this.col += 2;
			return new Token(TOK_GTE, ">=", line, col);
		}

		if (c === "<" && nc !== null && nc === ">") {
			this.pos += 2;
			this.col += 2;
			return new Token(TOK_NE, "<>", line, col);
		}
		
		if (c === "." && nc !== null && nc === ".") {
			this.pos += 2;
			this.col += 2;
			return new Token(TOK_TO, "..", line, col);
		}
		
		if (c === "|" && nc !== null && nc === "|") {
			this.pos += 2;
			this.col += 2;
			return new Token(TOK_CONCAT, "||", line, col);
		}
		
		if (c === "*" && nc !== null && nc === "*") {
			this.pos += 2;
			this.col += 2;
			return new Token(TOK_TIMES, "||", line, col);
		}		
		
		if (c === ")") {
			this.allowSignedInteger = false;
		}
				
		this.pos += 1;
		this.col += 1;
		
		if (c === "+") {
			return new Token(TOK_ADD, "+", line, col);
		}
		if (c === "-") {
			return new Token(TOK_SUB, "-", line, col);
		}
		if (c === "/") {
			return new Token(TOK_DIV, "/", line, col);
		}
		if (c === "%") {
			return new Token(TOK_REM, "%", line, col);
		}
		if (c === "*") {
			return new Token(TOK_MUL, "*", line, col);
		}
		if (c === "<") {
			return new Token(TOK_LT, "<", line, col);
		}
		if (c === ">") {
			return new Token(TOK_GT, ">", line, col);
		}
		if (c === "=") {
			return new Token(TOK_EQ, "=", line, col);
		}
		if (c === "(") {
			return new Token(TOK_BEGIN_GROUP, "(", line, col);
		}
		if (c === ")") {
			return new Token(TOK_END_GROUP, ")", line, col);
		}
		if (c === "[") {
			return new Token(TOK_BEGIN_ARRAY, "[", line, col);
		}
		if (c === "]") {
			return new Token(TOK_END_ARRAY, "]", line, col);
		}
		if (c === "{") {
			return new Token(TOK_BEGIN_AGG, "{", line, col);
		}
		if (c === "}") {
			return new Token(TOK_END_AGG, "}", line, col);
		}
		if (c === ".") {
			return new Token(TOK_SEL, ".", line, col);
		}
		if (c === ",") {
			return new Token(TOK_SEP, ",", line, col);
		}
		if (c === ":") {
			return new Token(TOK_OF, ";", line, col);
		}
		if (c === ";") {
			return new Token(TOK_TERM, ";", line, col);
		}
				
		return new Token(TOK_UNKOWN, c, line, col);
	}
}

