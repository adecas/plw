/******************************************************************************************************************************************

	TokenReader
	
	Split a string in a sequence of token

******************************************************************************************************************************************/

class Token {
	constructor(text, line, col) {
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
	
	static isInteger(token) {
		if (token.length === 0) {
			return false;
		}
		for (let i = 0; i < token.length; i++) {
			if (i == 0) {
				if (!TokenReader.isDigitChar(token.charAt(i)) && token.charAt(i) != "-") {
					return false;
				}
			} else {
				if (!TokenReader.isDigitChar(token.charAt(i))) {
					return false;
				}
			}
		}
		return true;
	}
	
	static isIdentifier(token) {
		if (token.length === 0) {
			return false;
		}
		for (let i = 0; i < token.length; i++) {
			if (!TokenReader.isIdentifierChar(token.charAt(i))) {
				return false;
			}
			if (i == 0 && TokenReader.isDigitChar(token.charAt(i))) {
				return false
			}
		}
		return true;
	}
	
	static isString(token) {
		if (token.length < 2) {
			return false;
		}
		if (token.charAt(0) !== "'" || token.charAt(token.length - 1) !== "'") {
			return false;
		}
		for (let i = 1; i < token.length - 1; i++) {
			if (token.charAt(i) === "'") {
				i++;
				if (i === token.length - 1 || token.charAt(i) !== "'") {
					return false;
				}
			}
		}
		return true;
	}
	
	static unescapeString(str) {
		return str.substr(1, str.length - 2).replace("''", "'");
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
		while (this.pos < this.exprStr.length ) {
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
		return new Token(this.exprStr.substr(beginPos, this.pos - beginPos), line, col);
	}
	
	readIdentifier() {
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
		return new Token(this.exprStr.substr(beginPos, this.pos - beginPos), line, col);
	}
	
	readInteger() {
		let line = this.line;
		let col = this.col;
		let beginPos = this.pos;
		if (this.pos < this.exprStr.length) {
			let c = this.exprStr.charAt(this.pos);
			if (TokenReader.isDigitChar(c) || c == "-") {
				this.pos++;
				this.col++;
				while (this.pos < this.exprStr.length) {
					c = this.exprStr.charAt(this.pos);
					if (!TokenReader.isDigitChar(c)) {
						break;
					}
					this.pos++;
					this.col++;
				}
			}
		}
		this.allowSignedInteger = false;
		return new Token(this.exprStr.substr(beginPos, this.pos - beginPos), line, col);
	}
		
	readToken() {
		this.skipBlank();
		
		if (this.pos === this.exprStr.length) {
			return new Token("", this.line, this.col);
		}
		let c = this.exprStr.charAt(this.pos);
		
		if (TokenReader.isDigitChar(c)) {
			return this.readInteger();
		}

		if (TokenReader.isIdentifierChar(c)) {
			return this.readIdentifier();
		}
		
		if (c === "'") {
			return this.readString();
		}
		
		let line = this.line;
		let col = this.col;
		
		let nc = this.pos + 1 < this.exprStr.length ? this.exprStr.charAt(this.pos + 1) : null; 

		
		if (this.allowSignedInteger && c === "-" && nc !== null && TokenReader.isDigitChar(nc)) {
			return this.readInteger();
		}
		
		this.allowSignedInteger = true;
		
		if (c === ":" && nc !== null && nc === "=") {
			this.pos += 2;
			this.col += 2;
			return new Token(":=", line, col);
		}
		
		if (c === "<" && nc !== null && nc === "=") {
			this.pos += 2;
			this.col += 2;
			return new Token("<=", line, col);
		}
		
		if (c === ">" && nc !== null && nc === "=") {
			this.pos += 2;
			this.col += 2;
			return new Token(">=", line, col);
		}

		if (c === "<" && nc !== null && nc === ">") {
			this.pos += 2;
			this.col += 2;
			return new Token("<>", line, col);
		}
		
		if (c === "." && nc !== null && nc === ".") {
			this.pos += 2;
			this.col += 2;
			return new Token("..", line, col);
		}
		
		if (c === "|" && nc !== null && nc === "|") {
			this.pos += 2;
			this.col += 2;
			return new Token("||", line, col);
		}
		
		if (c === ")") {
			this.allowSignedInteger = false;
		}
				
		this.pos += 1;
		this.col += 1;
		return new Token(c, line, col);
	}
}

