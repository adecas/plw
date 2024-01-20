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
const TOK_NULL = "tok-null";
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
const TOK_TYPE_SEP = "tok-type-sep";
const TOK_KINDOF = "tok-kindof";
const TOK_SEL = "tok-sel";
const TOK_SEP = "tok-sep";
const TOK_TERM = "tok-term";
const TOK_EOF = "tok-eof";
const TOK_UNKOWN = "tok-unknown";
const TOK_DIRECTIVE = "tok-directive";

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
	
	readDirective() {
		let line = this.line;
		let col = this.col;
		let beginPos = this.pos;
		let state = 0;
		while (this.pos < this.exprStr.length) {
			let c = this.exprStr.charAt(this.pos);
			if (state === 0) {
				if (c !== "@") break;
				state = 1;
			} else if (state === 1) {
				if (c === "@") state = 2;
			} else {
				if (c !== "@") break;
				state = 1;
			}
			this.col++;
			if (c === "\n") {
				this.line++;
				this.col = 1;
			}
			this.pos++;
		}
		return new Token(TOK_DIRECTIVE, this.exprStr.substr(beginPos + 1, this.pos - beginPos - 2).replace("@@", "@"), line, col);
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
		if (token === "null") {
			return new Token(TOK_NULL, token, line, col);
		}
		if (token === "false") {
			return new Token(TOK_FALSE, token, line, col);
		}
		if (token === "sequence") {
			return new Token(TOK_SEQUENCE, token, line, col);
		}
		if (token === "kindof") {
			return new Token(TOK_KINDOF, token, line, col);
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
		
		if (c === '@') {
			return this.readDirective();
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
		if (c === "|") {
			return new Token(TOK_TYPE_SEP, "|", line, col);
		}
				
		return new Token(TOK_UNKOWN, c, line, col);
	}
}

"use strict";
/******************************************************************************************************************************************

	AST
	
	Model of the syntax language

******************************************************************************************************************************************/

class AstNode {

	constructor(tag) {
		this.tag = tag;
		this.line = 0;
		this.col = 0;
	}
	
	fromToken(token) {
		this.line = token.line;
		this.col = token.col;
		return this;
	}
}

class AstDirective extends AstNode {
	constructor(text) {
		super("ast-directive");
		this.text = text;
	}
}

class AstValueBoolean extends AstNode {
	constructor(boolValue) {
		super("ast-value-boolean");
		this.boolValue = boolValue;
	}
}

class AstValueInteger extends AstNode {
	constructor(intValue) {
		super("ast-value-integer");
		this.intValue = intValue;
	}
}

class AstValueReal extends AstNode {
	constructor(realValue) {
		super("ast-value-real");
		this.realValue = realValue;
	}
}

class AstValueText extends AstNode {
	constructor(textValue) {
		super("ast-value-text");
		this.textValue = textValue;
	}
}

class AstValueArray extends AstNode {
	constructor(itemCount, items) {
		super("ast-value-array");
		this.itemCount = itemCount;
		this.items = items;
	}
}

class AstValueTuple extends AstNode {
	constructor(itemCount, items) {
		super("ast-value-tuple");
		this.itemCount = itemCount;
		this.items = items;
	}
}

class AstValueRecordField extends AstNode {
	constructor(fieldName, valueExpr) {
		super("ast-value-record-field");
		this.fieldName = fieldName;
		this.valueExpr = valueExpr;
	}
}

class AstValueRecord extends AstNode {
	constructor(fieldCount, fields) {
		super("ast-value-record");
		this.fieldCount = fieldCount;
		this.fields = fields;
	}
}

class AstTypeRecordField extends AstNode {
	constructor(fieldName, fieldType) {
		super("ast-type-record-field");
		this.fieldName = fieldName;
		this.fieldType = fieldType;
	}
}

class AstTypeRecord extends AstNode {
	constructor(fieldCount, fields) {
		super("ast-type-record");
		this.fieldCount = fieldCount;
		this.fields = fields;
	}
}

class AstTypeTuple extends AstNode {
	constructor(typeCount, types) {
		super("ast-type-tuple");
		this.typeCount = typeCount;
		this.types = types;
	}
}

class AstTypeVariant extends AstNode {
	constructor(typeCount, types) {
		super("ast-type-variant");
		this.typeCount = typeCount;
		this.types = types;
	}
}

class AstAs extends AstNode {
	constructor(expr, exprType) {
		super("ast-as");
		this.expr = expr;
		this.exprType = exprType;
	}
}

class AstOperatorBinary extends AstNode {
	constructor(operator, left, right) {
		super("ast-operator-binary");
		this.operator = operator;
		this.left = left;
		this.right = right;
	}	
}

class AstOperatorUnary extends AstNode {
	constructor(operator, operand) {
		super("ast-operator-unary");
		this.operator = operator;
		this.operand = operand;
	}
}

class AstConcat extends AstNode {
	constructor(itemCount, items) {
		super("ast-concat");
		this.itemCount = itemCount;
		this.items = items;
	}
}

class AstVariableDeclaration extends AstNode {
	constructor(varNameCount, varNames, valueExpr, isConst) {
		super("ast-variable-declaration");
		this.varNameCount = varNameCount;
		this.varNames = varNames;
		this.valueExpr = valueExpr;
		this.isConst = isConst;
	}
}

class AstVariable extends AstNode {
	constructor(varName) {
		super("ast-variable");
		this.varName = varName;
	}
}

class AstAssign extends AstNode {
	constructor(left, right) {
		super("ast-assign");
		this.left = left;
		this.right = right;
	}
}

class AstField extends AstNode {
	constructor(expr, fieldName) {
		super("ast-field");
		this.expr = expr;
		this.fieldName = fieldName;
	}	
}

class AstTypeNamed extends AstNode {
	constructor(typeName) {
		super("ast-type-named");
		this.typeName = typeName;
	}
}

class AstTypeArray extends AstNode {
	constructor(underlyingType) {
		super("ast-type-array");
		this.underlyingType = underlyingType;
	}
}

class AstTypeSequence extends AstNode {
	constructor(underlyingType) {
		super("ast-type-sequence");
		this.underlyingType = underlyingType;
	}
}

class AstIndex extends AstNode {
	constructor(indexed, index, indexTo) {
		super("ast-index");
		this.indexed = indexed;
		this.index = index;
		this.indexTo = indexTo;
	}
}

class AstBlock extends AstNode {
	constructor(statementCount, statements, exception) {
		super("ast-block");
		this.statementCount = statementCount;
		this.statements = statements;
		this.exception = exception;
	}
}

class AstException extends AstNode {
	constructor(whenStmtCount, whenStmts, defaultStmt) {
		super("ast-exception");
		this.whenStmtCount = whenStmtCount;
		this.whenStmts = whenStmts;
		this.defaultStmt = defaultStmt;
	}
}

class AstWhenStatement extends AstNode {
	constructor(whenExpr, statement) {
		super("ast-when-statement");
		this.whenExpr = whenExpr;
		this.statement = statement;
	}
}

class AstIf extends AstNode {
	constructor(condition, trueStatement, falseStatement) {
		super("ast-if");
		this.condition = condition;
		this.trueStatement = trueStatement;
		this.falseStatement = falseStatement;
	}
}

class AstWhile extends AstNode {
	constructor(condition, statement) {
		super("ast-while");
		this.condition = condition;
		this.statement = statement;
	}
}

class AstFor extends AstNode {
	constructor(index, isReverse, sequence, statement) {
		super("ast-for");
		this.index = index;
		this.isReverse = isReverse;
		this.sequence = sequence;
		this.statement = statement;
	}
}

class AstExit extends AstNode {
	constructor(condition) {
		super("ast-exit");
		this.condition = condition;
	}
}

class AstRange extends AstNode {
	constructor(lowerBound, upperBound) {
		super("ast-range");
		this.lowerBound = lowerBound;
		this.upperBound = upperBound;
	}
}

class AstParameter extends AstNode {
	constructor(parameterName, parameterType) {
		super("ast-parameter");
		this.parameterName = parameterName;
		this.parameterType = parameterType;
	}
}

class AstParameterList extends AstNode {
	constructor(parameterCount, parameters) {
		super("ast-parameter-list");
		this.parameterCount = parameterCount;
		this.parameters = parameters;
	}
}

class AstFunctionDeclaration extends AstNode {
	constructor(functionName, parameterList, returnType, statement, isGenerator) {
		super("ast-function-declaration");
		this.functionName = functionName;
		this.parameterList = parameterList;
		this.returnType = returnType;
		this.statement = statement;
		this.isGenerator = isGenerator;
	}
}

class AstProcedureDeclaration extends AstNode {
	constructor(procedureName, parameterList, statement) {
		super("ast-procedure-declaration");
		this.procedureName = procedureName;
		this.parameterList = parameterList;
		this.statement = statement;
	}
}

class AstReturn extends AstNode {
	constructor(expr) {
		super("ast-return");
		this.expr = expr;
	}
}

class AstRaise extends AstNode {
	constructor(expr) {
		super("ast-raise");
		this.expr = expr;
	}
}

class AstYield extends AstNode {
	constructor(expr) {
		super("ast-yield");
		this.expr = expr;
	}
}

class AstArgList extends AstNode {
	constructor(argCount, args) {
		super("ast-args");
		this.argCount = argCount;
		this.args = args;
	}
}

class AstFunction extends AstNode {
	constructor(functionName, argList) {
		super("ast-function");
		this.functionName = functionName;
		this.argList = argList;
	}
}

class AstProcedure extends AstNode {
	constructor(procedureName, argList) {
		super("ast-procedure");
		this.procedureName = procedureName;
		this.argList = argList;
	}
	
	static fromFunction(func) {
		let proc = new AstProcedure(func.functionName, func.argList);
		proc.line = func.line;
		proc.col = func.col;
		return proc;
	}
}

class AstTypeDeclaration extends AstNode {
	constructor(typeName, typeExpr) {
		super("ast-type-declaration");
		this.typeName = typeName;
		this.typeExpr = typeExpr;
	}
}

class AstCase extends AstNode {
	constructor(caseExpr, whenCount, whens, elseExpr) {
		super("ast-case");
		this.caseExpr = caseExpr;
		this.whenCount = whenCount;
		this.whens = whens;
		this.elseExpr = elseExpr;
	}
}

class AstWhen extends AstNode {
	constructor(whenExpr, thenExpr) {
		super("ast-when");
		this.whenExpr = whenExpr;
		this.thenExpr = thenExpr;
	}
}

class AstKindof extends AstNode {
	constructor(caseExpr, whenCount, whens, elseExpr) {
		super("ast-kindof");
		this.caseExpr = caseExpr;
		this.whenCount = whenCount;
		this.whens = whens;
		this.elseExpr = elseExpr;
	}
}

class AstKindofWhen extends AstNode {
	constructor(type, varName, thenExpr) {
		super("ast-kindof-when");
		this.type = type;
		this.varName = varName;
		this.thenExpr = thenExpr;
	}
}

class AstKindofStmt extends AstNode {
	constructor(caseExpr, whenCount, whens, elseBlock) {
		super("ast-kindof-stmt");
		this.caseExpr = caseExpr;
		this.whenCount = whenCount;
		this.whens = whens;
		this.elseBlock = elseBlock;
	}
}

class AstKindofWhenStmt extends AstNode {
	constructor(type, varName, thenBlock) {
		super("ast-kindof-when-stmt");
		this.type = type;
		this.varName = varName;
		this.thenBlock = thenBlock;
	}
}

class AstTypeAbstract extends AstNode {
	constructor(methodCount, methods) {
		super("ast-type-abstract");
		this.methodCount = methodCount;
		this.methods = methods;
	} 
}

class AstTypeAbstractMethod extends AstNode {
	constructor(methodName, parameterList, returnType) {
		super("ast-type-abstract-method");
		this.methodName = methodName;
		this.parameterList = parameterList;
		this.returnType = returnType;
	} 
}

class AstNull extends AstNode {
	constructor() {
		super("ast-null");
	}
}

"use strict";

/******************************************************************************************************************************************

	Parser
	
	Transforms a token sequence into and AST

******************************************************************************************************************************************/

class ParserError extends AstNode {

	constructor(errorText) {
		super("ast-parser-error");
		this.errorText = errorText;
	}
	
	static unexpectedToken(token, expected) {
		return new ParserError("Unexpected token " + token.tag + ", expected " + expected).fromToken(token);
	}
	
	static wrongEndSuffix(suffixToken, expected) {
		return new ParserError("Wrong end suffix " + suffixToken.text + ", expected " + expected).fromToken(suffixToken);
	}
	
}

class Parser {

	constructor(tokenReader) {
		this.tokenReader = tokenReader;
		this.nextToken = null;
		this.readToken();
	}
	
	peekToken() {
		return this.nextToken.tag;
	}
	
	readToken() {
		let token = this.nextToken;
		this.nextToken = this.tokenReader.readToken();
		return token;
	}
	
	static isError(astNode) {
		return astNode.tag === "ast-parser-error";
	}
	
	readStatement() {
		let stmt = null;
		if (this.peekToken() === TOK_VAR || this.peekToken() == TOK_CONST) {
			stmt = this.readVariableDeclaration();
		} else if (this.peekToken() === TOK_IF) {
			stmt = this.readIf();
		} else if (this.peekToken() === TOK_KINDOF) {
			stmt = this.readKindofStmt();
		} else if (this.peekToken() === TOK_WHILE) {
			stmt = this.readWhile();
		} else if (this.peekToken() === TOK_FUNCTION || this.peekToken() === TOK_GENERATOR) {
			stmt = this.readFunctionDeclaration();
		} else if (this.peekToken() === TOK_PROCEDURE) {
			stmt = this.readProcedureDeclaration();
		} else if (this.peekToken() === TOK_TYPE) {
			stmt = this.readTypeDeclaration();
		} else if (this.peekToken() === TOK_EXIT) {
			stmt = this.readExit();
		} else if (this.peekToken() === TOK_RETURN) {
			stmt = this.readReturn();
		} else if (this.peekToken() === TOK_YIELD) {
			stmt = this.readYield();
		} else if (this.peekToken() === TOK_RAISE) {
			stmt = this.readRaise();
		} else if (this.peekToken() === TOK_FOR) {
			stmt = this.readFor();
		} else if (this.peekToken() === TOK_BEGIN) {
			stmt = this.readAnonymousBlock();
		} else if (this.peekToken() === TOK_DIRECTIVE) {
			let dirTok = this.readToken();
			stmt = new AstDirective(dirTok.text).fromToken(dirTok);
		} else {
			stmt = this.readAssign();
		}
		if (Parser.isError(stmt)) {
			return stmt;
		}
		let smToken = this.readToken();
		if (smToken.tag !== TOK_TERM) {
			return ParserError.unexpectedToken(smToken, [TOK_TERM]);					
		}
		return stmt;
	}
	
	readAssign() {
		let expr = this.readExpression();
		if (Parser.isError(expr)) {
			return expr;
		}
		// TODO why we return a procedure in readAssign, it is ugly
		if (this.peekToken() !== TOK_ASSIGN && expr.tag === "ast-function") {
			return AstProcedure.fromFunction(expr);
		}
		let assignToken = this.readToken();
		if (assignToken.tag !== TOK_ASSIGN) {
			return ParserError.unexpectedToken(assignToken, [TOK_ASSIGN]);					
		}
		let right = this.readExpression();
		if (Parser.isError(right)) {
			return right;
		}
		return new AstAssign(expr, right).fromToken(assignToken);
	}
	
	readExpression() {
		return this.readExpr6();
	}	
	
	readExpr6() {
		let left = this.readExpr5();
		if (Parser.isError(left)) {
			return left;
		}
			
		while (this.peekToken() === TOK_OR) {
			let operator = this.readToken();
			
			let right = this.readExpr5();
			if (Parser.isError(right)) {
				return right;
			}
			
			left = new AstOperatorBinary(operator.tag, left, right).fromToken(operator);
		}
		
		return left;
	}
	
	readExpr5() {
		let left = this.readExpr4();		
		if (Parser.isError(left)) {
			return left;
		}
			
		while (this.peekToken() === TOK_AND) {
			let operator = this.readToken();
			
			let right = this.readExpr4();
			if (Parser.isError(right)) {
				return right;
			}
			
			left = new AstOperatorBinary(operator.tag, left, right).fromToken(operator);
		}
		
		return left;
	}
		
	readExpr4() {
		let left = this.readExpr3bis();
		if (Parser.isError(left)) {
			return left;
		}
		
		if (
			this.peekToken() === TOK_EQ ||
			this.peekToken() === TOK_GT ||
			this.peekToken() === TOK_LT ||
			this.peekToken() === TOK_GTE ||
			this.peekToken() === TOK_LTE ||
			this.peekToken() === TOK_NE ||
			this.peekToken() === TOK_IN
		) {
			let operator = this.readToken();
			let right = this.readExpr3bis();
			if (Parser.isError(right)) {
				return right;
			}
			left = new AstOperatorBinary(operator.tag, left, right).fromToken(operator);
		}
		
		return left;
	}
	
	readExpr3bis() {
		let expr = this.readExpr3();		
		if (Parser.isError(expr)) {
			return expr;
		}
		if (this.peekToken() !== TOK_CONCAT) {
			return expr;
		}
		let itemCount = 1;
		let items = [expr];
		let token = this.readToken();
		for (;;) {
			let item = this.readExpr3();
			if (Parser.isError(item)) {
				return item;
			}
			items[itemCount] = item;
			itemCount++;
			if (this.peekToken() !== TOK_CONCAT) {
				break;
			}
			this.readToken();
		}
		return new AstConcat(itemCount, items).fromToken(token);
	}

	readExpr3() {
		let left = this.readExpr2();		
		if (Parser.isError(left)) {
			return left;
		}
			
		while (
			this.peekToken() === TOK_ADD || this.peekToken() === TOK_SUB) {
			let operator = this.readToken();
			
			let right = this.readExpr2();
			if (Parser.isError(right)) {
				return right;
			}
			
			left = new AstOperatorBinary(operator.tag, left, right).fromToken(operator);
		}
		
		return left;
	}
	
	readExpr2() {
		let left = this.readExpr2bis();		
		if (Parser.isError(left)) {
			return left;
		}
			
		while (this.peekToken() === TOK_MUL || this.peekToken() === TOK_DIV || this.peekToken() === TOK_REM) {
			let operator = this.readToken();
			
			let right = this.readExpr2bis();
			if (Parser.isError(right)) {
				return right;
			}
			
			left = new AstOperatorBinary(operator.tag, left, right).fromToken(operator);
		}
		
		return left;
	}
	
	readExpr2bis() {
		let left = this.readExpr1();		
		if (Parser.isError(left)) {
			return left;
		}
			
		while (this.peekToken() === TOK_TIMES) {
			let operator = this.readToken();
			
			let right = this.readExpr1();
			if (Parser.isError(right)) {
				return right;
			}
			
			left = new AstOperatorBinary(operator.tag, left, right).fromToken(operator);
		}
		
		return left;
	}
	
	readExpr1() {
		let expr = this.readExpr0();
		if (Parser.isError(expr)) {
			return expr;
		}
		
		while (this.peekToken() === TOK_BEGIN_ARRAY || this.peekToken() === TOK_SEL) {			
			let token = this.readToken();
			if (token.tag === TOK_BEGIN_ARRAY) {
				let index = this.readExpression();
				if (Parser.isError(index)) {
					return index;
				}
				let indexTo = null;
				if (this.peekToken() == TOK_TO) {
					this.readToken();
					indexTo = this.readExpression();
					if (Parser.isError(indexTo)) {
						return indexTo;
					}
				}
				expr = new AstIndex(expr, index, indexTo).fromToken(token);
				let closeToken = this.readToken();
				if (closeToken.tag !== TOK_END_ARRAY) {
					return ParserError.unexpectedToken(closeToken, [TOK_END_ARRAY]);					
				}
			} else if (token.tag === TOK_SEL) {
				let fieldName = this.readToken();
				if (fieldName.tag !== TOK_IDENTIFIER) {
					return ParserError.unexpectedToken(fieldName, [TOK_IDENTIFIER])
				}
				expr = new AstField(expr, fieldName.text).fromToken(token);
			} else if (token.tag === TOK_TIMES) {
				
			} else {
				return ParserError.unexpectedToken(token, [TOK_BEGIN_ARRAY, TOK_SEL]);					
			}
		}
		
		while (this.peekToken() === TOK_AS) {
			let asToken = this.readToken();
			let exprType = this.readType();
			if (Parser.isError(exprType)) {
				return exprType;
			}
			expr = new AstAs(expr, exprType).fromToken(asToken);
		}
		
		return expr;
	}

	readExpr0() {
	
		if (this.peekToken() === TOK_BEGIN_GROUP) {
			return this.readExprGroup();
		}
	
		if (this.peekToken() === TOK_BEGIN_ARRAY) {
			return this.readArrayValue();
		}
		
		if (this.peekToken() === TOK_BEGIN_AGG) {
			return this.readRecordValue();
		}
		
		if (this.peekToken() === TOK_CASE) {
			return this.readCase();
		}
		
		if (this.peekToken() === TOK_KINDOF) {
			return this.readKindof();
		}
					
		let token = this.readToken();

		if (token.tag === TOK_SUB || token.tag === TOK_NOT) {
			let operand = this.readExpr1();
			if (Parser.isError(operand)) {
				return operand;
			}
			return new AstOperatorUnary(token.tag, operand).fromToken(token);
		}
		
		if (token.tag === TOK_TRUE || token.tag === TOK_FALSE) {
			return new AstValueBoolean(token.tag === TOK_TRUE).fromToken(token);
		}
		
		if (token.tag === TOK_NULL) {
			return new AstNull();
		}
		
		if (token.tag === TOK_INTEGER) {
			return new AstValueInteger(parseInt(token.text, 10)).fromToken(token);
		}
		
		if (token.tag === TOK_REAL) {
			return new AstValueReal(parseFloat(token.text)).fromToken(token);
		}

		if (token.tag === TOK_STRING) {
			return new AstValueText(token.text).fromToken(token);
		}
		
		if (token.tag === TOK_IDENTIFIER) {
			if (this.peekToken() === TOK_BEGIN_GROUP) {
				let argList = this.readArgList();
				if (Parser.isError(argList)) {
					return argList;
				}
				return new AstFunction(token.text, argList).fromToken(token);
			} else {
				return new AstVariable(token.text).fromToken(token);
			}
		}
		
		return ParserError.unexpectedToken(token, [
			TOK_IDENTIFIER, TOK_STRING, TOK_INTEGER, TOK_TRUE, TOK_FALSE,
			TOK_SUB, TOK_NOT, TOK_BEGIN_AGG, TOK_CASE, TOK_BEGIN_ARRAY, TOK_BEGIN_GROUP
		]);
	}
		
	readCase() {
		let caseToken = this.readToken();
		if (caseToken.tag !== TOK_CASE) {
			return ParserError.unexpectedToken(caseToken, [TOK_CASE]);
		}
		let caseExpr = null;
		if (this.peekToken() !== TOK_WHEN) {
			caseExpr = this.readExpression();
			if (Parser.isError(caseExpr)) {
				return caseExpr;
			}
		}
		let whens = [];
		let whenIndex = 0;
		while (this.peekToken() === TOK_WHEN) {
			let when = this.readWhen();
			if (Parser.isError(when)) {
				return when;
			}
			whens[whenIndex] = when;
			whenIndex++;
		}
		let elseToken = this.readToken();
		if (elseToken.tag !== TOK_ELSE) {
			return ParserError.unexpectedToken(elseToken, [TOK_ELSE]);
		}
		let elseExpr = this.readExpression();
		if (Parser.isError(elseExpr)) {
			return elseExpr;
		}
		let endToken = this.readToken();
		if (endToken.tag !== TOK_END) {
			return ParserError.unexpectedToken(endToken, [TOK_END]);
		}
		return new AstCase(caseExpr, whenIndex, whens, elseExpr);
	}
	
	readWhen() {
		let whenToken = this.readToken();
		if (whenToken.tag !== TOK_WHEN) {
			return ParserError.unexpectedToken(whenToken, [TOK_WHEN]);
		}
		let whenExpr = this.readExpression();
		if (Parser.isError(whenExpr)) {
			return whenExpr;
		}
		let thenToken = this.readToken();
		if (thenToken.tag !== TOK_THEN) {
			return ParserError.unexpectedToken(thenToken, [TOK_THEN]);
		}
		let thenExpr = this.readExpression();
		if (Parser.isError(thenExpr)) {
			return thenExpr;
		}
		return new AstWhen(whenExpr, thenExpr);
	}
	
	readKindof() {
		let kindofToken = this.readToken();
		if (kindofToken.tag !== TOK_KINDOF) {
			return ParserError.unexpectedToken(kindofToken, [TOK_KINDOF]);
		}
		let caseExpr = this.readExpression();
		if (Parser.isError(caseExpr)) {
			return caseExpr;
		}
		let whens = [];
		let whenIndex = 0;
		while (this.peekToken() === TOK_WHEN) {
			let when = this.readKindofWhen();
			if (Parser.isError(when)) {
				return when;
			}
			whens[whenIndex] = when;
			whenIndex++;
		}
		let elseExpr = null;
		if (this.peekToken() === TOK_ELSE) {
			this.readToken();
			elseExpr = this.readExpression();
			if (Parser.isError(elseExpr)) {
				return elseExpr;
			}
		}
		let endToken = this.readToken();
		if (endToken.tag !== TOK_END) {
			return ParserError.unexpectedToken(endToken, [TOK_END]);
		}
		return new AstKindof(caseExpr, whenIndex, whens, elseExpr);
	}
	
	readKindofWhen() {
		let whenToken = this.readToken();
		if (whenToken.tag !== TOK_WHEN) {
			return ParserError.unexpectedToken(whenToken, [TOK_WHEN]);
		}
		let type = this.readType();
		if (Parser.isError(type)) {
			return type;
		}
		let varName = this.readToken();
		if (varName.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(varName, [TOK_IDENTIFIER]);
		}
		let thenToken = this.readToken();
		if (thenToken.tag !== TOK_THEN) {
			return ParserError.unexpectedToken(thenToken, [TOK_THEN]);
		}
		let thenExpr = this.readExpression();
		if (Parser.isError(thenExpr)) {
			return thenExpr;
		}
		return new AstKindofWhen(type, varName.text, thenExpr);
	}
	
	readKindofStmt() {
		let kindofToken = this.readToken();
		if (kindofToken.tag !== TOK_KINDOF) {
			return ParserError.unexpectedToken(kindofToken, [TOK_KINDOF]);
		}
		let caseExpr = this.readExpression();
		if (Parser.isError(caseExpr)) {
			return caseExpr;
		}
		let whens = [];
		let whenIndex = 0;
		while (this.peekToken() === TOK_WHEN) {
			let when = this.readKindofWhenStmt();
			if (Parser.isError(when)) {
				return when;
			}
			whens[whenIndex] = when;
			whenIndex++;
		}
		let elseBlock = null;
		if (this.peekToken() === TOK_ELSE) {
			elseBlock = this.readBlockUntil(TOK_ELSE, [TOK_END]);
			if (Parser.isError(elseBlock)) {
				return elseBlock;
			}
		}
		let endToken = this.readToken();
		if (endToken.tag !== TOK_END) {
			return ParserError.unexpectedToken(endToken, [TOK_END]);
		}
		return new AstKindofStmt(caseExpr, whenIndex, whens, elseBlock);
	}

	readKindofWhenStmt() {
		let whenToken = this.readToken();
		if (whenToken.tag !== TOK_WHEN) {
			return ParserError.unexpectedToken(whenToken, [TOK_WHEN]);
		}
		let type = this.readType();
		if (Parser.isError(type)) {
			return type;
		}
		let varName = this.readToken();
		if (varName.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(varName, [TOK_IDENTIFIER]);
		}
		let thenBlock = this.readBlockUntil(TOK_THEN, [TOK_WHEN, TOK_ELSE, TOK_END]);
		if (Parser.isError(thenBlock)) {
			return thenBlock;
		}
		return new AstKindofWhenStmt(type, varName.text, thenBlock);
	}

	readExprGroup() {
		let openToken = this.readToken();
		if (openToken.tag !== TOK_BEGIN_GROUP) {
			return ParserError.unexpectedToken(openToken, [TOK_BEGIN_GROUP]);			
		}
		let expr = this.readExpression();
		if (Parser.isError(expr)) {
			return expr;
		}
		if (this.peekToken() !== TOK_SEP) {
			let closeToken = this.readToken();
			if (closeToken.tag !== TOK_END_GROUP) {
				return ParserError.unexpectedToken(closeToken, [TOK_END_GROUP]);			
			}
			return expr;
		}
		let exprCount = 1;
		let exprs = [expr];
		while (this.peekToken() === TOK_SEP) {
			this.readToken();
			expr = this.readExpression();
			if (Parser.isError(expr)) {
				return expr;
			}
			exprs[exprCount] = expr;
			exprCount++;			
		}
		let closeToken = this.readToken();
		if (closeToken.tag !== TOK_END_GROUP) {
			return ParserError.unexpectedToken(closeToken, [TOK_SEP, TOK_END_GROUP]);			
		}
		return new AstValueTuple(exprCount, exprs).fromToken(openToken);
	}
	
	readArrayValue() {
		let openToken = this.readToken();
		if (openToken.tag !== TOK_BEGIN_ARRAY) {
			return ParserError.unexpectedToken(openToken, TOK_BEGIN_ARRAY);
		}
		let itemValues = [];
		let itemIndex = 0;
		while (this.peekToken() !== TOK_END_ARRAY) {
			let valExpr = this.readExpression();
			if (Parser.isError(valExpr)) {
				return valExpr;
			}
			itemValues[itemIndex] = valExpr;
			itemIndex++;
			if (this.peekToken() === TOK_END_ARRAY) {
				break;
			}
			let sepToken = this.readToken();
			if (sepToken.tag != TOK_SEP) {
				return ParserError.unexpectedToken(sepToken, [TOK_SEP, TOK_END_ARRAY]);
			}
		}
		let closeToken = this.readToken();
		if (closeToken.tag !== TOK_END_ARRAY) {
			return ParserError.unexpectedToken(closeToken, [TOK_END_ARRAY]);
		}
		return new AstValueArray(itemIndex, itemValues).fromToken(openToken);
	}
	
	readRecordValueField() {
		let fieldName = this.readToken();
		if (fieldName.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(fieldName, [TOK_IDENTIFIER])
		}
		let ofToken = this.readToken();
		if (ofToken.tag !== TOK_OF) {
			return ParserError.unexpectedToken(ofToken, [TOK_OF]);
		}
		let expr = this.readExpression();
		if (Parser.isError(expr)) {
			return expr;
		}
		return new AstValueRecordField(fieldName.text, expr).fromToken(fieldName);	
	}
	
	readRecordValue() {
		let openToken = this.readToken();
		if (openToken.tag !== TOK_BEGIN_AGG) {
			return ParserError.unexpectedToken(openToken, [TOK_BEGIN_AGG]);
		}
		let fields = [];
		let fieldIndex = 0;
		while (this.peekToken() !== TOK_END_AGG) {
			let fieldExpr = this.readRecordValueField();
			if (Parser.isError(fieldExpr)) {
				return fieldExpr;
			}
			fields[fieldIndex] = fieldExpr;
			fieldIndex++;
			if (this.peekToken() === TOK_END_AGG) {
				break;
			}
			let sepToken = this.readToken();
			if (sepToken.tag != TOK_SEP) {
				return ParserError.unexpectedToken(sepToken, [TOK_SEP, TOK_END_AGG]);
			}
		}
		let closeToken = this.readToken();
		if (closeToken.tag !== TOK_END_AGG) {
			return ParserError.unexpectedToken(closeToken, [TOK_END_AGG]);
		}
		return new AstValueRecord(fieldIndex, fields).fromToken(openToken);		
	}
	
	readType() {
		let type = this.readTypeNoVariant();
		if (Parser.isError(type) || this.peekToken() !== TOK_TYPE_SEP) {
			return type;
		}
		let types = [type];
		let typeCount = 1;
		while (this.peekToken() === TOK_TYPE_SEP) {
			this.readToken();
			let type = this.readTypeNoVariant();
			if (Parser.isError(type)) {
				return type;
			}
			types[typeCount] = type;
			typeCount++;
		}
		return new AstTypeVariant(typeCount, types);
	}
	
	readTypeNoVariant() {
		if (this.peekToken() === TOK_SEQUENCE) {
			return this.readTypeSequence();
		}
		if (this.peekToken() === TOK_BEGIN_AGG) {
			return this.readTypeRecord();
		}
		if (this.peekToken() === TOK_BEGIN_ARRAY) {
			return this.readTypeArray();
		}
		if (this.peekToken() === TOK_BEGIN_GROUP) {
			return this.readTypeTuple();
		}
		let typeName = this.readToken();
		if (typeName.tag === TOK_NULL) {
			return new AstNull();
		}
		if (typeName.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(typeName, [TOK_NULL, TOK_IDENTIFIER, TOK_BEGIN_ARRAY, TOK_BEGIN_AGG, TOK_SEQUENCE]);
		}
		return new AstTypeNamed(typeName.text).fromToken(typeName);
	}
	
	readTypeArray() {
		let openToken = this.readToken();
		if (openToken.tag !== TOK_BEGIN_ARRAY) {
			return ParserError.unexpectedToken(openToken, [TOK_BEGIN_ARRAY]);
		}
		let itemType = this.readType();
		if (Parser.isError(itemType)) {
			return itemType;
		}
		let closeToken = this.readToken();
		if (closeToken.tag !== TOK_END_ARRAY) {
			return ParserError.unexpectedToken(closeToken, [TOK_END_ARRAY]);
		}
		return new AstTypeArray(itemType).fromToken(openToken);
	}
	
	readTypeSequence() {
		let seqToken = this.readToken();
		if (seqToken.tag !== TOK_SEQUENCE) {
			return ParserError.unexpectedToken(seqToken, [TOK_SEQUENCE])
		}
		let openToken = this.readToken();
		if (openToken.tag !== TOK_BEGIN_GROUP) {
			return ParserError.unexpectedToken(openToken, [TOK_BEGIN_GROUP]);
		}
		let underlyingType = this.readType();
		if (Parser.isError(underlyingType)) {
			return underlyingType;
		}
		let closeToken = this.readToken();
		if (closeToken.tag !== TOK_END_GROUP) {
			return ParserError.unexpectedToken(closeToken, [TOK_END_GROUP]);
		}
		return new AstTypeSequence(underlyingType);
	}
	
	readTypeRecordField() {
		let fieldName = this.readToken();
		if (fieldName.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(fieldName, [TOK_IDENTIFIER]);
		}
		let fieldType = this.readType();
		if (Parser.isError(fieldType)) {
			return fieldType;
		}
		return new AstTypeRecordField(fieldName.text, fieldType).fromToken(fieldName);	
	}

	readTypeRecord() {
		let openToken = this.readToken();
		if (openToken.tag !== TOK_BEGIN_AGG) {
			return ParserError.unexpectedToken(openToken, [TOK_BEGIN_AGG]);
		}
		let fields = [];
		let fieldIndex = 0;
		while (this.peekToken() !== TOK_END_AGG) {
			if (fieldIndex > 0) {
				let sepToken = this.readToken();
				if (sepToken.tag !== TOK_SEP) {
					return ParserError.unexpectedToken(sepToken, [TOK_SEP, TOK_END_AGG]);
				}
			}
			let fieldExpr = this.readTypeRecordField();
			if (Parser.isError(fieldExpr)) {
				return fieldExpr;
			}
			fields[fieldIndex] = fieldExpr;
			fieldIndex++;
		}
		let closeToken = this.readToken();
		if (closeToken.tag !== TOK_END_AGG) {
			return ParserError.unexpectedToken(closeToken, [TOK_END_AGG]);
		}
		return new AstTypeRecord(fieldIndex, fields).fromToken(openToken);		
	}
	
	readTypeTuple() {
		let openToken = this.readToken();
		if (openToken.tag !== TOK_BEGIN_GROUP) {
			return ParserError.unexpectedToken(openToken, [TOK_BEGIN_GROUP]);
		}
		let types = [];
		let typeCount = 0;
		while (typeCount < 2 || this.peekToken() !== TOK_END_GROUP) {
			if (typeCount > 0) {
				let sepToken = this.readToken();
				if (sepToken.tag !== TOK_SEP) {
					return ParserError.unexpectedToken(sepToken, [TOK_SEP, TOK_END_GROUP]);
				}
			}
			let fieldName = this.readToken();
			if (fieldName.tag !== TOK_IDENTIFIER) {
				return ParserError.unexpectedToken(fieldName, [TOK_IDENTIFIER]);
			}
			let typeExpr = this.readType();
			if (Parser.isError(typeExpr)) {
				return typeExpr;
			}
			types[typeCount] = typeExpr;
			typeCount++;
		}
		let closeToken = this.readToken();
		if (closeToken.tag !== TOK_END_GROUP) {
			return ParserError.unexpectedToken(closeToken, [TOK_END_GROUP]);
		}
		return new AstTypeTuple(typeCount, types).fromToken(openToken);		
	}
		
	readTypeVariantField() {
		let fieldName = this.readToken();
		if (fieldName.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(fieldName, [TOK_IDENTIFIER]);
		}
		let fieldType = null;
		if (this.peekToken() !== TOK_END_GROUP && this.peekToken() !== TOK_SEP) {
			fieldType = this.readType();
			if (Parser.isError(fieldType)) {
				return fieldType;
			}
		}
		return new AstTypeRecordField(fieldName.text, fieldType).fromToken(fieldName);	
	}
		
	readTypeDeclaration() {
		let typeToken = this.readToken();
		if (typeToken.tag !== TOK_TYPE) {
			return ParserError.unexpectedToken(typeToken, [TOK_TYPE]);
		}
		let typeName = this.readToken();
		if (typeName.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(typeName, [TOK_IDENTIFIER])
		}
		let typeExpr = this.readType();
		if (Parser.isError(typeExpr)) {
			return typeExpr;
		}
		return new AstTypeDeclaration(typeName.text, typeExpr).fromToken(typeToken);
	}
	
	readVariableDeclaration() {
		let varToken = this.readToken();
		if (varToken.tag !== TOK_VAR && varToken.tag !== TOK_CONST) {
			return ParserError.unexpectedToken(varToken, [TOK_VAR, TOK_CONST]);
		}
		let varNameCount = 0;
		let varNames = [];
		let inGroup = false;
		if (this.peekToken() == TOK_BEGIN_GROUP) {
			this.readToken();
			inGroup = true;
		}
		let varName = this.readToken();
		if (varName.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(varName, [TOK_IDENTIFIER])
		}
		varNameCount = 1;
		varNames = [varName.text];
		if (inGroup) {
			while (this.peekToken() === TOK_SEP) {
				this.readToken();
				let varName = this.readToken();
				if (varName.tag !== TOK_IDENTIFIER) {
					return ParserError.unexpectedToken(varName, [TOK_IDENTIFIER])
				}
				varNames[varNameCount] = varName.text;
				varNameCount++;				
			}
			let closeToken = this.readToken();
			if (closeToken.tag !== TOK_END_GROUP) {
				return ParserError.unexpectedToken(closeToken, [TOK_SEP, TOK_END_GROUP])
			}
		}
		let assign = this.readToken();
		if (assign.tag !== TOK_ASSIGN) {
			return ParserError.unexpectedToken(assign, [TOK_ASSIGN]);
		}
		let expr = this.readExpression();
		if (Parser.isError(expr)) {
			return expr;
		}
		return new AstVariableDeclaration(varNameCount, varNames, expr, varToken.tag === TOK_CONST).fromToken(varToken);
	}
	
	readIf() {
		return this.readIfOrElsif(TOK_IF);
	}
	
	readElsif() {
		return this.readIfOrElsif(TOK_ELSIF);
	}
	
	readIfOrElsif(ifTokenTag) {
		let ifToken = this.readToken();
		if (ifToken.tag !== ifTokenTag) {
			return ParserError.unexpectedToken(ifToken, [ifTokenTag]);
		}		
		let condition = this.readExpression();
		if (Parser.isError(condition)) {
			return condition;
		}
		let trueStatement = this.readBlockUntil(TOK_THEN, [TOK_END, TOK_ELSE, TOK_ELSIF]);
		if (Parser.isError(trueStatement)) {
			return trueStatement;
		}
		if (this.peekToken() === TOK_ELSIF) {
			let falseStatement = this.readElsif();
			if (Parser.isError(falseStatement)) {
				return falseStatement;
			}
			return new AstIf(condition, trueStatement, falseStatement).fromToken(ifToken);
		}
		let falseStatement = null;
		if (this.peekToken() === TOK_ELSE) {
			falseStatement = this.readBlockUntil(TOK_ELSE, [TOK_END, TOK_ELSE, TOK_ELSIF]);
			if (Parser.isError(falseStatement)) {
				return falseStatement;
			}
		}
		let endToken = this.readToken();
		if (endToken.tag !== TOK_END) {
			return ParserError.unexpectedToken(endToken, [TOK_END]);
		}
		let endIfToken = this.readToken();
		if (endIfToken.tag !== TOK_IF) {
			return ParserError.unexpectedToken(endIfToken, [TOK_IF]);
		}
		return new AstIf(condition, trueStatement, falseStatement).fromToken(ifToken);
	}
	
	readLoopBlock() {
		let block = this.readBlockUntil(TOK_LOOP, [TOK_END]);
		if (Parser.isError(block)) {
			return block;
		}
		let endToken = this.readToken();
		if (endToken.tag !== TOK_END) {
			return ParserError.unexpectedToken(endToken, [TOK_END]);
		}
		let endLoopToken = this.readToken();
		if (endLoopToken.tag !== TOK_LOOP) {
			return ParserError.unexpectedToken(endLoopToken, [TOK_LOOP]);
		}
		return block;
	}
	
	readAnonymousBlock() {
		return this.readBlock(null);
	}
	
	readBlockUntil(beginTokenTag, stopTokenTags) {
		let beginToken  = this.readToken();
		if (beginToken.tag !== beginTokenTag) {
			return ParserError.unexpectedToken(beginToken, [beginTokenTag]);
		}
		let statementIndex = 0;
		let statements = [];
		let token = this.peekToken();
		while (stopTokenTags.indexOf(token) === - 1) {
			let statement = this.readStatement();
			if (Parser.isError(statement)) {
				return statement;
			}
			statements[statementIndex] = statement;
			statementIndex++;			
			token = this.peekToken();
		}
		return new AstBlock(statementIndex, statements, null).fromToken(beginToken);
	}
	
	readWhenStatement() {
		let whenToken = this.readToken();
		if (whenToken.tag !== TOK_WHEN) {
			return ParserError.unexpectedToken(whenToken, [TOK_WHEN]);			
		}
		let whenExpr = this.readExpression();
		if (Parser.isError(whenExpr)) {
			return whenExpr;
		}
		let block = this.readBlockUntil(TOK_THEN, [TOK_END, TOK_WHEN, TOK_ELSE]);
		if (Parser.isError(block)) {
			return block;
		}
		return new AstWhenStatement(whenExpr, block).fromToken(whenToken);
	}
	
	readException() {
		let exceptionToken  = this.readToken();
		if (exceptionToken.tag !== TOK_EXCEPTION) {
			return ParserError.unexpectedToken(exceptionToken, [TOK_EXCEPTION]);
		}
		let whenStmtCount = 0;
		let whenStmts = [];
		while (this.peekToken() === TOK_WHEN) {
			let whenStmt = this.readWhenStatement();
			if (Parser.isError(whenStmt)) {
				return whenStmt;
			}
			whenStmts[whenStmtCount] = whenStmt;
			whenStmtCount++;
		}
		let defaultStmt = null;
		if (this.peekToken() === TOK_ELSE) {
			defaultStmt = this.readBlockUntil(TOK_ELSE, [TOK_END]);
			if (Parser.isError(defaultStmt)) {
				return defaultStmt;
			}
		}
		return new AstException(whenStmtCount, whenStmts, defaultStmt);
	}
	
	readBlock(blockName) {
		let block = this.readBlockUntil(TOK_BEGIN, [TOK_END, TOK_EXCEPTION]);
		if (Parser.isError(block)) {
			return block;
		}
		if (this.peekToken() === TOK_EXCEPTION) {
			let exception = this.readException();
			if (Parser.isError(exception)) {
				return exception;
			}
			block.exception = exception;
		}
		let endToken = this.readToken();
		if (endToken.tag !== TOK_END) {
			return ParserError.unexpectedToken(endToken, [TOK_END]);
		}
		if (blockName !== null) {
			let blockNameToken = this.readToken();
			if (blockNameToken.tag !== TOK_IDENTIFIER) {
				return ParserError.unexpectedToken(blockNameToken, [TOK_IDENTIFIER]);
			}
			if (blockNameToken.text !== blockName) {
				return ParserError.wrongEndSuffix(blockNameToken, blockName);
			}
		}
		return block;
	}
	
	readWhile() {
		let whileToken = this.readToken();
		if (whileToken.tag !== TOK_WHILE) {
			return ParserError.unexpectedToken(whileToken,  [TOK_WHILE]);
		}
		let condition = this.readExpression();
		if (Parser.isError(condition)) {
			return condition;
		}
		let statement = this.readLoopBlock();
		if (Parser.isError(statement)) {
			return statement;
		}
		return new AstWhile(condition, statement).fromToken(whileToken);
	}
	
	readParameter(isGenerator) {
		let parameterName = this.readToken();
		if (parameterName.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(parameterName, [TOK_IDENTIFIER])
		}
		let parameterType = this.readType();
		if (Parser.isError(parameterType)) {
			return parameterType;
		}
		return new AstParameter(parameterName.text, parameterType).fromToken(parameterName);	
	}

	readParameterList(isGenerator) {
		let openToken = this.readToken();
		if (openToken.tag !== TOK_BEGIN_GROUP) {
			return ParserError.unexpectedToken(openToken, [TOK_BEGIN_GROUP]);
		}
		let parameters = [];
		let parameterIndex = 0;
		while (this.peekToken() !== TOK_END_GROUP) {
			if (parameterIndex > 0) {
				let sepToken = this.readToken();
				if (sepToken.tag !== TOK_SEP) {
					return ParserError.unexpectedToken(sepToken, [TOK_SEP, TOK_END_GROUP]);
				}
			}
			let parameter = this.readParameter(isGenerator);
			if (Parser.isError(parameter)) {
				return parameter;
			}
			parameters[parameterIndex] = parameter;
			parameterIndex++;
		}
		this.readToken();
		return new AstParameterList(parameterIndex, parameters).fromToken(openToken);		
	}
	
	readFunctionDeclaration() {
		let functionToken = this.readToken();
		if (functionToken.tag !== TOK_FUNCTION && functionToken.tag !== TOK_GENERATOR) {
			return ParserError.unexpectedToken(functionToken,  [TOK_FUNCTION, TOK_GENERATOR]);
		}
		let isGenerator = functionToken.tag === TOK_GENERATOR;
		let functionName = this.readToken();
		if (functionName.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(functionName, [TOK_IDENTIFIER]);
		}
		let parameterList = this.readParameterList(isGenerator);
		if (Parser.isError(parameterList)) {
			return parameterList;
		}
		let returnType = this.readType();
		if (Parser.isError(returnType)) {
			return returnType;
		}
		let statement = this.readBlock(functionName.text);
		if (Parser.isError(statement)) {
			return statement;
		}
		return new AstFunctionDeclaration(functionName.text, parameterList, returnType, statement, isGenerator).fromToken(functionToken);
	}
	
	readProcedureDeclaration() {
		let procedureToken = this.readToken();
		if (procedureToken.tag !== TOK_PROCEDURE) {
			return ParserError.unexpectedToken(procedureToken,  [TOK_PROCEDURE]);
		}
		let procedureName = this.readToken();
		if (procedureName.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(procedureName, [TOK_IDENTIFIER]);
		}
		let parameterList = this.readParameterList(false);
		if (Parser.isError(parameterList)) {
			return parameterList;
		}
		let statement = this.readBlock(procedureName.text);
		if (Parser.isError(statement)) {
			return statement;
		}
		return new AstProcedureDeclaration(procedureName.text, parameterList, statement).fromToken(procedureToken);
	}

	readReturn() {
		let retToken = this.readToken();
		if (retToken.tag !== TOK_RETURN) {
			return ParserError.unexpectedToken(retToken, [TOK_RETURN]);
		}
		let expr = null;
		if (this.peekToken() !== TOK_TERM) {
			expr = this.readExpression();
			if (Parser.isError(expr)) {
				return expr;
			}
		}
		return new AstReturn(expr).fromToken(retToken);
	}
	
	readExit() {
		let exitToken = this.readToken();
		if (exitToken.tag !== TOK_EXIT) {
			return ParserError.unexpectedToken(exitToken, [TOK_EXIT]);
		}
		let condition = null;
		if (this.peekToken() === TOK_WHEN) {
			this.readToken();
			condition = this.readExpression();
			if (Parser.isError(condition)) {
				return condition;
			}
		}
		return new AstExit(condition).fromToken(exitToken);
	}
	
	readRaise() {
		let raiseToken = this.readToken();
		if (raiseToken.tag !== TOK_RAISE) {
			return ParserError.unexpectedToken(raiseToken, [TOK_RAISE]);
		}
		let expr = this.readExpression();
		if (Parser.isError(expr)) {
			return expr;
		}
		return new AstRaise(expr).fromToken(raiseToken);
	}

	readYield() {
		let yieldToken = this.readToken();
		if (yieldToken.tag !== TOK_YIELD) {
			return ParserError.unexpectedToken(yieldToken, [TOK_YIELD]);
		}
		let expr = this.readExpression();
		if (Parser.isError(expr)) {
			return expr;
		}
		return new AstYield(expr).fromToken(yieldToken);
	}
	
	readArgList() {
		let openToken = this.readToken();
		if (openToken.tag !== TOK_BEGIN_GROUP) {
			return ParserError.unexpectedToken(openToken, [TOK_BEGIN_GROUP]);
		}
		let args = [];
		let argIndex = 0;
		while (this.peekToken() !== TOK_END_GROUP) {
			if (argIndex > 0) {
				let sepToken = this.readToken();
				if (sepToken.tag !== TOK_SEP) {
					return ParserError.unexpectedToken(sepToken, [TOK_SEP, TOK_END_GROUP]);
				}
			}
			let arg = this.readExpression();
			if (Parser.isError(arg)) {
				return arg;
			}
			args[argIndex] = arg;
			argIndex++;
		}
		this.readToken();
		return new AstArgList(argIndex, args).fromToken(openToken);		
	}
	
	readFor() {
		let forToken = this.readToken();
		if (forToken.tag !== TOK_FOR) {
			return ParserError.unexpectedToken(forToken, [TOK_FOR]);
		}
		let index = this.readToken();
		if (index.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(index, [TOK_IDENTIFIER]);
		}
		let inToken = this.readToken();
		if (inToken.tag !== TOK_IN) {
			return ParserError.unexpectedToken(inToken, [TOK_IN]);
		}
		let isReverse = false;
		if (this.peekToken() === TOK_REVERSE) {
			this.readToken();
			isReverse = true;
		}
		let sequence = this.readExpression();
		if (Parser.isError(sequence)) {
			return sequence;
		}
		if (this.peekToken() === TOK_TO) {
			let rangeToken = this.readToken();
			let upperBound = this.readExpression();
			if (Parser.isError(upperBound)) {
				return upperBound;
			}
			sequence = new AstRange(sequence, upperBound).fromToken(rangeToken);
		}
		let statement = this.readLoopBlock();
		if (Parser.isError(statement)) {
			return statement;
		}
		return new AstFor(index.text, isReverse, sequence, statement).fromToken(forToken);
	}
}
"use strict";

const PLW_OPCODE_NOARG										= 1;
const PLW_OPCODE_JZ											= 2;
const PLW_OPCODE_JNZ										= 3;
const PLW_OPCODE_JMP										= 4;
const PLW_OPCODE_PUSH										= 5;
const PLW_OPCODE_PUSH_GLOBAL								= 6;
const PLW_OPCODE_PUSH_GLOBAL_MOVE							= 7;
const PLW_OPCODE_PUSH_GLOBAL_FOR_MUTATE						= 8;
const PLW_OPCODE_PUSH_LOCAL									= 9;
const PLW_OPCODE_PUSH_LOCAL_MOVE                            = 10;
const PLW_OPCODE_PUSH_LOCAL_FOR_MUTATE						= 11;
const PLW_OPCODE_POP_GLOBAL									= 12;
const PLW_OPCODE_POP_LOCAL									= 13;
const PLW_OPCODE_POP_VOID									= 14;
const PLW_OPCODE_CALL										= 15;
const PLW_OPCODE_CALL_NATIVE								= 16;
const PLW_OPCODE_PUSHF										= 17;
const PLW_OPCODE_EQ											= 18;
const PLW_OPCODE_RET										= 19;
const PLW_OPCODE_DUP                                  		= 20;
const PLW_OPCODE_SWAP										= 21;
const PLW_OPCODE_EXT										= 22;


// no arg

const PLW_OPCODE_SUSPEND									= 1;
const PLW_OPCODE_ADD										= 2;
const PLW_OPCODE_ADDF										= 3;
const PLW_OPCODE_SUB										= 4;
const PLW_OPCODE_SUBF										= 5;
const PLW_OPCODE_DIV										= 6;
const PLW_OPCODE_DIVF										= 7;
const PLW_OPCODE_REM										= 8;
const PLW_OPCODE_MUL										= 9;
const PLW_OPCODE_MULF										= 10;
const PLW_OPCODE_NEG										= 11;
const PLW_OPCODE_NEGF										= 12;
const PLW_OPCODE_GT											= 13;
const PLW_OPCODE_GTF										= 14;
const PLW_OPCODE_LT											= 15;
const PLW_OPCODE_LTF										= 16;
const PLW_OPCODE_GTE										= 17;
const PLW_OPCODE_GTEF										= 18;
const PLW_OPCODE_LTE										= 19;
const PLW_OPCODE_LTEF										= 20;
const PLW_OPCODE_AND										= 21;
const PLW_OPCODE_OR											= 22;
const PLW_OPCODE_NOT										= 23;

const PLW_OPCODES = [
	"",
	"NOARG",
	"JZ",
	"JNZ",
	"JMP",
	"PUSH",
	"PUSH_GLOBAL",
	"PUSH_GLOBAL_MOVE",
	"PUSH_GLOBAL_FOR_MUTATE",
	"PUSH_LOCAL",
	"PUSH_LOCAL_MOVE",
	"PUSH_LOCAL_FOR_MUTATE",
	"POP_GLOBAL",
	"POP_LOCAL",
	"POP_VOID",
	"CALL",
	"CALL_NATIVE",
	"PUSHF",
	"EQ",
	"RET",
	"DUP",
	"SWAP",
	"INTERNAL"			
];	

const PLW_NOARG_OPCODES = [
	"",
	"SUSPEND",
	"ADD",
	"ADDF",
	"SUB",
	"SUBF",
	"DIV",
	"DIVF",
	"REM",
	"MUL",
	"MULF",
	"NEG",
	"NEGF",
	"GT",
	"GTF",
	"LT",
	"LTF",
	"GTE",
	"GTEF",
	"LTE",
	"LTEF",
	"AND",
	"OR",
	"NOT"
];

"use strict";
/******************************************************************************************************************************************

	Language opcodes
	
	Opcodes that are specific to the language

******************************************************************************************************************************************/

const PLW_LOPCODE_CREATE_STRING						    = 0;
const PLW_LOPCODE_CONCAT_STRING                         = 1;
const PLW_LOPCODE_CREATE_BLOB                           = 2;
const PLW_LOPCODE_READ_BLOB                             = 3;
const PLW_LOPCODE_WRITE_BLOB                            = 4;
const PLW_LOPCODE_CONCAT_BLOB                           = 5;
const PLW_LOPCODE_GET_BLOB_MUTABLE_OFFSET				= 6;
const PLW_LOPCODE_GET_BLOB_SIZE                         = 7;
const PLW_LOPCODE_GET_BLOB_INDEX_OF_ITEM          		= 8;
const PLW_LOPCODE_SLICE_BLOB							= 9;
const PLW_LOPCODE_CREATE_BLOB_REPEAT_ITEM				= 10;
const PLW_LOPCODE_CREATE_EXCEPTION_HANDLER				= 11;
const PLW_LOPCODE_RAISE_EXCEPTION						= 12;
const PLW_LOPCODE_CREATE_GENERATOR						= 13;
const PLW_LOPCODE_GET_GENERATOR_NEXT_ITEM				= 14;
const PLW_LOPCODE_HAS_GENERATOR_ENDED					= 15;
const PLW_LOPCODE_YIELD_GENERATOR_ITEM					= 16;

const PLW_LOPCODES = [
	"CREATE_STRING",
	"CONCAT_STRING",
	"CREATE_BLOB",
	"READ_BLOB",
	"WRITE_BLOB",
	"CONCAT_BLOB",
	"GET_BLOB_MUTABLE_OFFSET",
	"GET_BLOB_SIZE",
	"GET_BLOB_INDEX_OF_ITEM",
	"SLICE_BLOB",
	"CREATE_BLOB_REPEAT_ITEM",
	"CREATE_EXCEPTION_HANDLER",
	"RAISE_EXCEPTION",
	"CREATE_GENERATOR",
	"GET_GENERATOR_NEXT_ITEM",
	"HAS_GENERATOR_ENDED",
	"YIELD_GENERATOR_ITEM"
];

"use strict";
/******************************************************************************************************************************************

	Compiler
	
	Transforms AST in StackMachine code

******************************************************************************************************************************************/


class EvalResult {
	
	constructor(tag) {
		this.tag = tag;
	}
	
	isError() {
		return false;
	}
	
}

class EvalResultType extends EvalResult {
	constructor(tag, isRef) {
		super(tag);
		this.isRef = isRef;
		this.key = null;
		this.globalId = 0;
	}
	
	typeKey() {
		return this.key;
	}
	
	structuralType() {
		return this;
	}
	
	toAst() {
		return null;
	}
	
	slotCount() {
		return 1;
	}

}

class EvalTypeNull extends EvalResultType {

	constructor() {
		super("res-type-null", false);
	}
	
	typeKey() {
		return "null";
	}
	
	toAst() {
		return new AstNull();
	}
	
	slotCount() {
		return 0;
	}

}

class EvalTypeBuiltIn extends EvalResultType {
	constructor(typeName, isRef) {
		super("res-type-built-in", isRef);
		this.typeName = typeName;
		this.key = typeName;
	}
	
	toAst() {
		return new AstTypeNamed(this.typeName);
	}
}

const EVAL_TYPE_NULL = new EvalTypeNull();
const EVAL_TYPE_EXCEPTION_HANDLER = new EvalTypeBuiltIn("_exception_handler", true);
const EVAL_TYPE_INFER = new EvalTypeBuiltIn("_infer", false);
const EVAL_TYPE_ANY = new EvalTypeBuiltIn("any", false);
const EVAL_TYPE_INTEGER = new EvalTypeBuiltIn("integer", false);
const EVAL_TYPE_REAL = new EvalTypeBuiltIn("real", false);
const EVAL_TYPE_BOOLEAN = new EvalTypeBuiltIn("boolean", false);
const EVAL_TYPE_TEXT = new EvalTypeBuiltIn("text", true);

class EvalTypeRecordField {
	constructor(fieldName, fieldType) {
		this.fieldName = fieldName;
		this.fieldType = fieldType;
		this.offset = 0;
	}
	
	toAst() {
		return new AstRecordField(this.fieldName, this.fieldType.toAst());
	}
}

class EvalTypeRecord extends EvalResultType {
	constructor(fieldCount, fields) {
		super("res-type-record", true);
		this.fieldCount = fieldCount;
		this.fields = fields;
		this.fieldSlotCount = 0;
		for (let i = 0; i < fields.length; i++) {
			fields[i].offset = this.fieldSlotCount;
			this.fieldSlotCount += fields[i].fieldType.slotCount();
		}
		this.key = EvalTypeRecord.makeTypeKey(fieldCount, fields);
	}
	
	static makeTypeKey(fieldCount, fields) {
		let name = "{";
		for (let i = 0; i < fieldCount; i++) {
			name += (i == 0 ? "" : ", ") + fields[i].fieldName + " " + fields[i].fieldType.typeKey();
		}
		return name + "}";
	}
	
	getField(fieldName) {
		for (let i = 0; i < this.fieldCount; i++) {
			if (this.fields[i].fieldName === fieldName) {
				return this.fields[i];
			}
		}
		return null;
	}
	
	toAst() {
		let astFields = [];
		for (let i = 0; i < this.fieldCount; i++) {
			astFields[i] = this.fields[i].toAst();
		}
		return new AstTypeRecord(this.fieldCount, astFields);
	}
}

class EvalTypeTuple extends EvalResultType {
	constructor(typeCount, types) {
		super("res-type-tuple", false);
		this.typeCount = typeCount;
		this.types = types;
		this.key = EvalTypeTuple.makeTypeKey(typeCount, types);
		this.totalSlotCount = 0;
		for (let i = 0; i < this.typeCount; i++) {
			this.totalSlotCount += this.types[i].slotCount();
		}
	}

	static makeTypeKey(typeCount, types) {
		let keys = [];
		for (let i = 0; i < typeCount; i++) {
			keys[i] = types[i].typeKey();
		}
		return "(" + keys.join(',') + ")";
	}
	
	slotCount() {
		return this.totalSlotCount;
	}
	
	toAst() {
		let astTypes = [];
		for (let i = 0; i < this.typeCount; i++) {
			astTypes[i] = this.types[i].toAst();
		}
		return new AstTypeTuple(this.typeCount, astTypes);
	}	
}

class EvalTypeVariant extends EvalResultType {
	constructor(typeCount, types) {
		super("res-type-variant", true);
		this.typeCount = typeCount;
		this.types = types;
		this.key = EvalTypeVariant.makeTypeKey(typeCount, types);
		this.maxSlotCount = 0;
		for (let i = 0; i < this.typeCount; i++) {
			if (this.types[i].slotCount() > this.maxSlotCount) {
				this.maxSlotCount = this.types[i].slotCount();
			}
		}
		this.maxSlotCount++;
	}

	static makeTypeKey(typeCount, types) {
		let keys = [];
		for (let i = 0; i < typeCount; i++) {
			keys[i] = types[i].typeKey();
		}
		return keys.join('|');
	}
	
	slotCount() {
		return this.maxSlotCount;
	}
	
	contains(type) {
		if (type.tag === "res-type-variant") {
			for (let i = 0; i < type.typeCount; i++) {
				if (!this.contains(type.types[i])) {
					return false;
				}
			}
			return true;
		}
		for (let i = 0; i < this.typeCount; i++) {
			if (this.types[i] === type) {
				return true;
			}
		}
		return false;
	}
	
	toAst() {
		let astTypes = [];
		for (let i = 0; i < this.typeCount; i++) {
			astTypes[i] = this.types[i].toAst();
		}
		return new AstTypeVariant(this.typeCount, astTypes);
	}
	
}

class EvalTypeArray extends EvalResultType {
	constructor(underlyingType) {
		super("res-type-array", true);
		this.underlyingType = underlyingType;
		this.key = "[" + (this.underlyingType === null ? "" : this.underlyingType.typeKey()) + "]";
	}
	
	toAst() {
		return new AstTypeArray(this.underlyingType.toAst());
	}
}

class EvalTypeSequence extends EvalResultType {
	constructor(underlyingType) {
		super("res-type-sequence", true);
		this.underlyingType = underlyingType;
		this.key = "sequence(" + (this.underlyingType === null ? "" : this.underlyingType.typeKey()) + ")";
	}
	
	toAst()  {
		return new AstTypeSequence(this.underlyingType.toAst());
	}
}

class EvalTypeName extends EvalResultType {
	constructor(typeName, underlyingType) {
		super("res-type-name", underlyingType.isRef);
		this.typeName = typeName;
		this.underlyingType = underlyingType;
		this.key = typeName;
		this.structType = this.underlyingType.structuralType();
	}
	
	structuralType() {
		return this.structType;
	}
	
	toAst() {
		return new AstTypeNamed(this.typeName);
	}
	
	slotCount() {
		return this.structType.slotCount();
	}
	
}

const EVAL_TYPE_CHAR = new EvalTypeName("char", EVAL_TYPE_INTEGER);

class EvalResultParameter extends EvalResult {
	constructor(parameterName, parameterType) {
		super("res-parameter");
		this.parameterName = parameterName;
		this.parameterType = parameterType;
	}
}

class EvalResultParameterList extends EvalResult {
	constructor(parameterCount, parameters) {
		super("res-parameter-list");
		this.parameterCount = parameterCount;
		this.parameters = parameters;
	}
	
	indexOfAny() {
		for (let i = 0; i < this.parameterCount; i++) {
			if (this.parameters[i].parameterType === EVAL_TYPE_ANY) {
				return i;
			}
		}
		return -1;
	}
	
	countOfAny() {
		let count = 0;
		for (let i = 0; i < this.parameterCount; i++) {
			if (this.parameters[i].parameterType === EVAL_TYPE_ANY) {
				count++;
			}
		}
		return count;
	}
	
	isMatch(argTypes) {
		if (argTypes.length !== this.parameterCount) {
			return false;
		}
		for (let i = 0; i < this.parameterCount; i++) {
			if (this.parameters[i].parameterType !== EVAL_TYPE_ANY && this.parameters[i].parameterType !== argTypes[i]) {
				return false;
			}
		}
		return true;
	}
}

class EvalResultMacroFunction extends EvalResult {
	constructor(functionName, parameterList, returnType, isGenerator, astStmt) {
		super("res-macro-function");
		this.functionName = functionName;
		this.parameterList = parameterList;
		this.returnType = returnType;
		this.isGenerator = isGenerator;
		this.astStmt = astStmt;
	}
	
	functionShortKey() {
		return this.functionName + "(" + this.parameterList.parameterCount + ")";
	}
	
	functionKey() {
		let funcKey = this.functionName + "(";
		for (let i = 0; i < this.parameterList.parameterCount; i++) {
			funcKey += (i > 0 ? "," : "") +
				this.parameterList.parameters[i].parameterType.typeKey();
		}
		return funcKey + ")";
	}	
}

class EvalResultFunction extends EvalResult {
	constructor(functionName, parameterList, returnType, isGenerator) {
		super("res-function");
		this.functionName = functionName;
		this.parameterList = parameterList;
		this.returnType = returnType;
		this.isGenerator = isGenerator;
		this.codeBlockIndex = -1;
		this.nativeIndex = -1;
		this.internalIndex = -1;
	}
	
	static fromNative(functionName, parameterList, returnType, nativeIndex) {
		let nativeFunc = new EvalResultFunction(functionName, parameterList, returnType, false);
		nativeFunc.nativeIndex = nativeIndex;
		// console.log("Native function " + nativeIndex + ": " + nativeFunc.functionKey());
		return nativeFunc;
	}

	functionKey() {
		let funcKey = this.functionName + "(";
		for (let i = 0; i < this.parameterList.parameterCount; i++) {
			funcKey += (i > 0 ? "," : "") +
				this.parameterList.parameters[i].parameterType.typeKey();
		}
		return funcKey + ")";
	}
	
	static makeKey(functionName, paramCount, paramTypes) {
		let funcKey = functionName + "(";
		for (let i = 0; i < paramCount; i++) {
			funcKey += (i > 0 ? "," : "") +
				paramTypes[i].typeKey();
		}
		return funcKey + ")";
	}
	
}

class EvalResultProcedure extends EvalResult {
	constructor(procedureName, parameterList) {
		super("res-procedure");
		this.procedureName = procedureName;
		this.parameterList = parameterList;
		this.codeBlockIndex = -1;
		this.nativeIndex = -1;
	}
	
	static fromNative(procedureName, parameterList, nativeIndex) {
		let nativeProc = new EvalResultProcedure(procedureName, parameterList);
		nativeProc.nativeIndex = nativeIndex;
		// console.log("Native procedure " + nativeIndex + ": " + nativeProc.procedureKey());
		return nativeProc;
	}
	
	procedureKey() {
		let procKey = this.procedureName + "(";
		for (let i = 0; i < this.parameterList.parameterCount; i++) {
			procKey += (i > 0 ? "," : "") +
				this.parameterList.parameters[i].parameterType.typeKey();
		}
		return procKey + ")";
	}
}

class EvalResultMacroProcedure extends EvalResult {
	constructor(procedureName, parameterList, astStmt) {
		super("res-macro-procedure");
		this.procedureName = procedureName;
		this.parameterList = parameterList;
		this.astStmt = astStmt;
	}
	
	procedureShortKey() {
		return this.procedureName + "(" + this.parameterList.parameterCount + ")";
	}
	
	procedureKey() {
		let procKey = this.procedureName + "(";
		for (let i = 0; i < this.parameterList.parameterCount; i++) {
			procKey += (i > 0 ? "," : "") +
				this.parameterList.parameters[i].parameterType.typeKey();
		}
		return procKey + ")";
	}	
}


const EVAL_RESULT_RETURN = new EvalResult("res-return");
const EVAL_RESULT_RAISE = new EvalResult("res-raise");
const EVAL_RESULT_OK = new EvalResult("res-ok");


class EvalError extends EvalResult {

	constructor(errorText) {
		super("res-error");
		this.errorText = errorText;
		this.line = 0;
		this.col = 0;
	}
	
	isError() {
		return true;
	}
	
	fromExpr(expr) {
		this.line = expr.line;
		this.col = expr.col;
		return this;
	}
	
	static unassignable(tag) {
		return new EvalError("Unassignable left expression " + tag);
	}
	
	static cantMutateConst(varName) {
		return new EvalError("Can't mutate const " + varName);
	}
	
	static unknownBinaryOperator(operator) {
		return new EvalError("Unknown binary operator " + operator);
	}
	
	static wrongType(exprType, expected) {
		return new EvalError("Wrong type " + exprType.typeKey() + ", expected " + expected);
	}
	
	static unknownType(exprType) {
		return new EvalError("Unknown type " + exprType);
	}
	
	static noTypeArray() {
		return new EvalError("Array has no type");
	}
	
	static variableAlreadyExists(varName) {
		return new EvalError("Variable " + varName + " already exists");
	}
	
	static parameterAlreadyExists(parameterName) {
		return new EvalError("Parameter " + parameterName + " already exists");
	}
	
	static functionAlreadyExists(funcName) {
		return new EvalError("Function " + funcName + " already exists");
	}
	
	static procedureAlreadyExists(procName) {
		return new EvalError("Procedure " + procName + " already exists");
	}

	static typeAlreadyExists(typeName) {
		return new EvalError("Type " + typeName + " already exists");
	}

	static unknownVariable(varName) {
		return new EvalError("Unknown variable " + varName);
	}
	
	static unknownField(fieldName, record) {
		return new EvalError("Unknown field " + fieldName + " in " + record);
	}
	
	static unknownFunction(funcName) {
		return new EvalError("Unknown function " + funcName);
	}
	
	static unknownNativeFunction(funcName) {
		return new EvalError("Unknown native function " + funcName);
	}
	
	static unknownProcedure(procName) {
		return new EvalError("Unknown procedure " + procName);
	}

	static indexOutOfBound(index) {
		return new EvalError("Index out of bound " + index);
	}
	
	static noFunctionReturn(funcName) {
		return new EvalError("No return for function " + funcName);
	}
	
	static noFunctionYield(funcName) {
		return new EvalError("No yield for function " + funcName);
	}

	static unexpectedExit() {
		return new EvalError("Unexpected exit");
	}

	static unexpectedReturn() {
		return new EvalError("Unexpected return");
	}
	
	static unexpectedReturnWithValue() {
		return new EvalError("Unexpected return with value");
	}
	
	static unexpectedReturnWithoutValue() {
		return new EvalError("Unexpected return without value");
	}

	static unexpectedYield() {
		return new EvalError("Unexpected yield");
	}

	static unreachableCode() {
		return new EvalError("Unreachable code");
	}
	
	static variantKindAlreadyManaged(kindName) {
		return new EvalError("Variant kind " + kindName + " already managed");
	}
	
	static variantKindNotManaged(kindName) {
		return new EvalError("Variant kind " + kindName + " not managed");
	}
	
	static unknownVariantKind(kindName) {
		return new EvalError("Unknown kind " + kindName);
	}
	
	static fieldAlreadyExists(fieldName) {
		return new EvalError("Field " + fieldName + " already exists");
	}
	
	static emptyArrayMustBeTyped() {
		return new EvalError("Empty array must be typed with the as operator");
	}
	
	static tupleSizeMismatch(expected, val) {
		return new EvalError("Tuple with " + val + " items when " + expected + " were expected");
	}
	
	static todo(msg) {
		return new EvalError("TODO " + msg);
	}
		
}

class CodeBlock {

	constructor(blockName) {
		this.blockName = blockName;
		this.codes = [];
		this.codeSize = 0;
		this.strConsts = [];
		this.strConstSize = 0;
		this.floatConsts = [];
		this.floatConstSize = 0;
	}
	
	currentLoc() {
		return this.codeSize - 1;
	}
	
	addStrConst(str) {
		for (let i = 0; i < this.strConstSize; i++) {
			if (this.strConsts[i] === str) {
				return i;
			}
		}
		let strId = this.strConstSize;
		this.strConsts[strId] = str;
		this.strConstSize++;
		return strId;
	}
	
	addFloatConst(f) {
		for (let i = 0; i < this.floatConstSize; i++) {
			if (this.floatConsts[i] === f) {
				return i;
			}
		}
		let floatId = this.floatConstSize;
		this.floatConsts[floatId] = f;
		this.floatConstSize++;
		return floatId;
	}

	setLoc(offset) {
		this.codes[offset] = this.codeSize;
	}
	
	code1(inst) {
		this.codes[this.codeSize] = PLW_OPCODE_NOARG;
		this.codeSize++;
		this.codes[this.codeSize] = inst;
		this.codeSize++;
	}
	
	code2(inst, arg) {
		this.codes[this.codeSize] = inst;
		this.codeSize++;
		this.codes[this.codeSize] = arg;
		this.codeSize++;
	}
	
	codeSuspend() {
		this.code1(PLW_OPCODE_SUSPEND);
	}
	
	codePush(val) {
		this.code2(PLW_OPCODE_PUSH, val);
		return this.codeSize - 1;
	}
	
	codePushf(val) {
		this.code2(PLW_OPCODE_PUSHF, val);
	}
		
	codePushGlobal(offset) {
		this.code2(PLW_OPCODE_PUSH_GLOBAL, offset);
	}
	
	codePushGlobalForMutate(offset) {
		this.code2(PLW_OPCODE_PUSH_GLOBAL_FOR_MUTATE, offset);
	}
	
	codePushLocal(offset) {
		this.code2(PLW_OPCODE_PUSH_LOCAL, offset);
	}
	
	codePushLocalMove(offset) {
		this.code2(PLW_OPCODE_PUSH_LOCAL_MOVE, offset);
	}	
	
	codePushLocalForMutate(offset) {
		this.code2(PLW_OPCODE_PUSH_LOCAL_FOR_MUTATE, offset);
	}	
		
	codePopGlobal(offset) {
		this.code2(PLW_OPCODE_POP_GLOBAL, offset);
	}
	
	codePopLocal(offset) {
		this.code2(PLW_OPCODE_POP_LOCAL, offset);
	}
	
	codePopVoid(count) {
		this.code2(PLW_OPCODE_POP_VOID, count);
	}
	
	codeAdd() {
		this.code1(PLW_OPCODE_ADD);
	}
	
	codeSub() {
		this.code1(PLW_OPCODE_SUB);
	}

	codeDiv() {
		this.code1(PLW_OPCODE_DIV);
	}

	codeRem() {
		this.code1(PLW_OPCODE_REM);
	}

	codeMul() {
		this.code1(PLW_OPCODE_MUL);
	}
	
	codeNeg() {
		this.code1(PLW_OPCODE_NEG);
	}
	
	codeGt() {
		this.code1(PLW_OPCODE_GT);
	}

	codeGte() {
		this.code1(PLW_OPCODE_GTE);
	}

	codeLt() {
		this.code1(PLW_OPCODE_LT);
	}

	codeLte() {
		this.code1(PLW_OPCODE_LTE);
	}
	
	// real

	codeAddf() {
		this.code1(PLW_OPCODE_ADDF);
	}
	
	codeSubf() {
		this.code1(PLW_OPCODE_SUBF);
	}

	codeDivf() {
		this.code1(PLW_OPCODE_DIVF);
	}

	codeMulf() {
		this.code1(PLW_OPCODE_MULF);
	}
	
	codeNegf() {
		this.code1(PLW_OPCODE_NEGF);
	}
	
	codeGtf() {
		this.code1(PLW_OPCODE_GTF);
	}

	codeGtef() {
		this.code1(PLW_OPCODE_GTEF);
	}

	codeLtf() {
		this.code1(PLW_OPCODE_LTF);
	}

	codeLtef() {
		this.code1(PLW_OPCODE_LTEF);
	}
		
	// real

	codeAnd() {
		this.code1(PLW_OPCODE_AND);
	}
	
	codeOr() {
		this.code1(PLW_OPCODE_OR);
	}
	
	codeNot() {
		this.code1(PLW_OPCODE_NOT);
	}
		
	codeJz(offset) {
		this.code2(PLW_OPCODE_JZ, offset);
		return this.codeSize - 1;
	}
	
	codeJnz(offset) {
		this.code2(PLW_OPCODE_JNZ, offset);
		return this.codeSize - 1;
	}
	
	codeJmp(offset) {
		this.code2(PLW_OPCODE_JMP, offset);
		return this.codeSize - 1;
	}
				
	codeCall(ptr) {
		this.code2(PLW_OPCODE_CALL, ptr);
	}
		
	codeCallNative(ptr) {
		this.code2(PLW_OPCODE_CALL_NATIVE, ptr);
	}
	
	codeEq(count) {
		this.code2(PLW_OPCODE_EQ, count);
	}
	
	codeRet(count) {
		this.code2(PLW_OPCODE_RET, count);
	}
	
	codeDup(count) {
		this.code2(PLW_OPCODE_DUP, count);
	}
	
	codeSwap(count) {
		this.code2(PLW_OPCODE_SWAP, count);
	}
		
	codeExt(extOpcode) {
		this.code2(PLW_OPCODE_EXT, extOpcode);
	}
	
}

class CompilerContext {
	
	constructor() {
		this.globalScope = CompilerScope.makeGlobal();
		this.types = {};
		this.functions = {};
		this.procedures = {};
		this.macroFunctions = {};
		this.macroProcedures = {};
		this.codeBlocks = [];
		this.globalTypeIdSeq = 0;
		this.addType(EVAL_TYPE_INFER);
		this.addType(EVAL_TYPE_ANY);
		this.addType(EVAL_TYPE_INTEGER);
		this.addType(EVAL_TYPE_REAL);
		this.addType(EVAL_TYPE_BOOLEAN);
		this.addType(EVAL_TYPE_TEXT);
		this.addType(EVAL_TYPE_CHAR);
	}
	
	nextGlobalTypeId() {
		this.globalTypeIdSeq++;
		return this.globalTypeIdSeq;
	}
	
	getFunction(functionKey) {
		let func = this.functions[functionKey];
		return func === undefined ? null : func;
	}
	
	addFunction(evalFunc) {
		this.functions[evalFunc.functionKey()] = evalFunc;
	}
	
	removeFunction(functionKey) {
		delete this.functions[functionKey];
	}
	
	getProcedure(procedureKey) {
		let proc = this.procedures[procedureKey];
		return proc === undefined ? null : proc;
	}
	
	addProcedure(evalProc) {
		this.procedures[evalProc.procedureKey()] = evalProc;
	}
	
	removeProcedure(procedureKey) {
		delete this.procedures[procedureKey];
	}
	
	getType(typeName) {
		let type = this.types[typeName];
		return type === undefined ? null : type;
	}
	
	addType(evalType) {
		let uniqueType = this.getType(evalType.typeKey());
		if (uniqueType === null) {
			evalType.globalId = this.nextGlobalTypeId();
			this.types[evalType.typeKey()] = evalType;
			return evalType;
		}
		return uniqueType;
	}
	
	addCodeBlock(blockName) {
		let i = this.codeBlocks.length;
		this.codeBlocks[i] = new CodeBlock(blockName);
		// console.log("Code block " + i + ": " + blockName);
		return i;
	}
	
	getMacroFunction(functionShortKey, functionKey) {
		let bucket = this.macroFunctions[functionShortKey];
		if (bucket === undefined) {
			return null;
		}
		return bucket[functionKey] === undefined ? null : buckect[functionKey];
	}
	
	addMacroFunction(macroFunction) {
		let bucket = this.macroFunctions[macroFunction.functionShortKey()];
		if (bucket === undefined) {
			bucket = {};
			this.macroFunctions[macroFunction.functionShortKey()] = bucket;
		}
		bucket[macroFunction.functionKey()] = macroFunction;
	}
	
	findMacroFunction(functionName, argTypes) {
		let bucket = this.macroFunctions[functionName + "(" + argTypes.length + ")"];
		if (bucket === undefined) {
			return null;
		}
		let minAnyCount = -1;
		let maxFirstAnyIndex = -1;
		let bestMacro = null;
		for (const macroKey in bucket) {
			let macroFunc = bucket[macroKey];
			if (macroFunc.parameterList.isMatch(argTypes)) {
				let anyCount = macroFunc.parameterList.countOfAny();
				let firstAnyIndex = macroFunc.parameterList.indexOfAny();
				if (minAnyCount === -1 || anyCount < minAnyCount) {
					minAnyCount = anyCount;
					maxFirstAnyIndex = firstAnyIndex;
					bestMacro = macroFunc;
				} else if (anyCount === minAnyCount && firstAnyIndex > maxFirstAnyIndex) {
					maxFirstAnyIndex = firstAnyIndex;
					bestMacro = macroFunc;					
				}
			}
		}
		return bestMacro;
	}
	
	getMacroProcedure(procedureShortKey, procedureKey) {
		let bucket = this.macroProcedures[procedureShortKey];
		if (bucket === undefined) {
			return null;
		}
		return bucket[procedureKey] === undefined ? null : buckect[procedureKey];
	}
	
	addMacroProcedure(macroProcedure) {
		let bucket = this.macroProcedures[macroProcedure.procedureShortKey()];
		if (bucket === undefined) {
			bucket = {};
			this.macroProcedures[macroProcedure.procedureShortKey()] = bucket;
		}
		bucket[macroProcedure.procedureKey()] = macroProcedure;
	}
	
	findMacroProcedure(procedureName, argTypes) {
		let bucket = this.macroProcedures[procedureName + "(" + argTypes.length + ")"];
		if (bucket === undefined) {
			return null;
		}
		let minAnyCount = -1;
		let maxFirstAnyIndex = -1;
		let bestMacro = null;
		for (const macroKey in bucket) {
			let macroProc = bucket[macroKey];
			if (macroProc.parameterList.isMatch(argTypes)) {
				let anyCount = macroProc.parameterList.countOfAny();
				let firstAnyIndex = macroProc.parameterList.indexOfAny();
				if (minAnyCount === -1 || anyCount < minAnyCount) {
					minAnyCount = anyCount;
					maxFirstAnyIndex = firstAnyIndex;
					bestMacro = macroProc;
				} else if (anyCount === minAnyCount && firstAnyIndex > maxFirstAnyIndex) {
					maxFirstAnyIndex = firstAnyIndex;
					bestMacro = macroProc;					
				}
			}
		}
		return bestMacro;
	}		
			
}

class VariableStatLoc {
	constructor(loc, line, col) {
		this.loc = loc;
		this.line = line;
		this.col = col;
	}
}

class VariableStat {

	constructor() {
		this.moveLocCount = 0;
		this.moveLocs = [];
		this.tmpMoveLoc = null;
	}

	addReadLoc(loc, expr) {
		this.tmpMoveLoc = new VariableStatLoc(loc, expr.line, expr.col);
	}
	
	addReset() {
		if (this.tmpMoveLoc !== null) {
			this.moveLocs[this.moveLocCount] = this.tmpMoveLoc;
			this.moveLocCount++;
			this.tmpMoveLoc = null;
		}
	}	
	
}

class CompilerVariable {
	constructor(varName, varType, isConst, isGlobal, isParameter, offset, isWithStat) {
		this.varName = varName;
		this.varType = varType;
		this.isConst = isConst;
		this.isGlobal = isGlobal;
		this.isParameter = isParameter;
		this.offset = offset;
		if (isWithStat) {
			this.stat = new VariableStat();
		} else {
			this.stat = null;
		}
	}		
}

class CompilerScope {

	static makeGlobal() {
		return new CompilerScope(null, false, false, false, null);
	}
	
	static makeBlock(parent) {
		return new CompilerScope(parent, false, false, false, null);
	}
	
	static makeLoop(parent) {
		return new CompilerScope(parent, false, false, true, null);
	}
	
	static makeFunction(parent, isGenerator, returnType) {
		return new CompilerScope(parent, true, isGenerator, false, returnType);
	}
	
	static makeProcedure(parent) {
		return new CompilerScope(parent, true, false, false, null);
	}
	
	constructor(parent, isFrame, isGenerator, isLoop, returnType) {
		this.parent = parent;
		this.isFrame = isFrame;
		this.isGenerator = isGenerator;
		this.isLoop = isLoop;
		this.returnType = returnType;
		this.isGlobal = parent === null || (this.parent.isGlobal && isFrame === false);
		this.variables = [];
		this.parameters = [];
		this.variableCount = 0;
		this.parameterCount = 0;
		this.variableOffset = 0;
		this.offset = parent === null || isFrame ? 0 : (parent.offset + parent.variableOffset);
		this.exitLocs = [];
		this.exitLocCount = 0;
	}
	
	findFrame() {
		let currentScope = this;
		while (currentScope !== null) {
			if (currentScope.isFrame) {
				break;
			}
			currentScope = currentScope.parent;
		}
		return currentScope;
	}
	
	clearVarStatTmp() {
		let currentScope = this;
		while (currentScope.parent !== null) {
			for (let i = 0; i < currentScope.variableCount; i++) {
				let varStat = currentScope.variables[i].stat;
				if (varStat != null) {
					varStat.tmpMoveLoc = null;
				}
			}
			if (currentScope.isFrame) {
				break;
			}
			currentScope = currentScope.parent;
		}
	}
				
	getLocalVariable(varName) {
		for (let i = 0; i < this.variableCount; i++) {
			if (this.variables[i].varName === varName) {
				return this.variables[i];
			}
		}
		for (let i = 0; i < this.parameterCount; i++) {
			if (this.parameters[i].varName === varName) {
				return this.parameters[i];
			}
		}
		return null;
	}
	
	getVariable(varName) {
		let scope = this;
		let onlyConst = false;
		while (scope !== null) {
		 	let val = scope.getLocalVariable(varName);
			if (val !== null && (onlyConst === false || val.isConst === true)) {
				return val;
			}
			if (scope.isFrame) {
				onlyConst = true;
			}
			scope = scope.parent;
		}
		return null;
	}
	
	addParameter(varName, varType) {
		let newVar = new CompilerVariable(varName, varType, false, false, true, 0, varType.isRef);
		this.parameters[this.parameterCount] = newVar;
		this.parameterCount++;
		return newVar;
	}
	
	endAddParameter() {
		let currentOffset = -4;
		for (let i = this.parameterCount - 1; i >= 0; i--) {
			currentOffset = currentOffset - this.parameters[i].varType.slotCount();
			this.parameters[i].offset = currentOffset;
		}
	}

	addVariable(varName, varType, isConst) {
		let isWithStat = varType.isRef && this.parent !== null;
		let newVar = new CompilerVariable(varName, varType, isConst, this.isGlobal, false, this.offset + this.variableOffset, isWithStat);
		this.variables[this.variableCount] = newVar;
		this.variableCount++;
		this.variableOffset += varType.slotCount();
		return newVar;	
	}
	
}


class Compiler {

	constructor(context) {
		this.context = context;
		this.scope = this.context.globalScope;
		this.codeBlock = new CodeBlock("global");
	}
	
	resetCode() {
		this.codeBlock = new CodeBlock("global");
	}
	
	pushScopeBlock() {
		this.scope = CompilerScope.makeBlock(this.scope);
	}
	
	pushScopeLoop() {
		this.scope = CompilerScope.makeLoop(this.scope);
	}

	pushScopeFunction(isGenerator, returnType) {
		this.scope = CompilerScope.makeFunction(this.scope, isGenerator, returnType);
	}
	
	pushScopeProcedure() {
		this.scope = CompilerScope.makeProcedure(this.scope);
	}
	
	popScope() {
		let msg = "";
		for (let i = 0; i < this.scope.variableCount; i++) {
			let variable = this.scope.variables[i];
			if (variable.stat !== null) {
				variable.stat.addReset();
				for (let k = 0; k < variable.stat.moveLocCount; k++) {
					let loc = variable.stat.moveLocs[k];
					msg += variable.varName + "(" + loc.line + "," + loc.col + ") ";
					let codeOffset = loc.loc;
					if (codeOffset < 0 || codeOffset >= this.codeBlock.codeSize) {
						console.log("Inconsistent loc " + loc.loc);
					} else {
						let opcode = this.codeBlock.codes[codeOffset];
						if (opcode === PLW_OPCODE_PUSH_GLOBAL) {
							this.codeBlock.codes[codeOffset] = PLW_OPCODE_PUSH_GLOBAL_MOVE;
						} else if (opcode === PLW_OPCODE_PUSH_LOCAL) {
							this.codeBlock.codes[codeOffset] = PLW_OPCODE_PUSH_LOCAL_MOVE;
						} else {
							console.log("Inconsistent opcode " + this.codeBlock.codes[loc.loc]);
						}
					}
				}
			}
		}
		//if (msg !== "") {
		//	console.log("Moves: " + msg); 
		//}
		this.scope = this.scope.parent;
	}
	
	addType(evalType) {
		let uniqueType = this.context.getType(evalType.typeKey());
		if (uniqueType === null) {
			uniqueType = this.context.addType(evalType);
			if (uniqueType.structuralType().tag === "res-type-array") {
				this.generateArrayFunctions(uniqueType);
			}
		}
		return uniqueType;
	}
	
	generateArrayFunctions(evalType) {
		let lengthFunc = this.generateArrayLengthFunction(evalType);
		this.generateArrayLastIndexFunction(evalType, lengthFunc);
		this.generateArrayIndexOfFunction(evalType);
	}
	
	generateArrayLengthFunction(evalType) {	
		var func = new EvalResultFunction(
			"length",
			new EvalResultParameterList(1, [new EvalResultParameter("array", evalType)]),
			EVAL_TYPE_INTEGER, 
			false
		);
		let itemType = evalType.underlyingType;	
		if (itemType.slotCount() == 1) {
			func.internalIndex = PLW_LOPCODE_GET_BLOB_SIZE;
		} else {
			func.codeBlockIndex = this.context.addCodeBlock(func.functionKey());
			let cb = this.context.codeBlocks[func.codeBlockIndex];
			cb.codePushLocal(-5);
			cb.codeExt(PLW_LOPCODE_GET_BLOB_SIZE);
			cb.codePush(evalType.underlyingType.slotCount());
			cb.codeDiv();
			cb.codeRet(1);
		}
		this.context.addFunction(func);
		return func;
	}
	
	generateArrayLastIndexFunction(evalType, lengthFunc) {
		var func = new EvalResultFunction(
			"last_index",
			new EvalResultParameterList(1, [new EvalResultParameter("array", evalType)]),
			EVAL_TYPE_INTEGER, 
			false
		);
		func.codeBlockIndex = this.context.addCodeBlock(func.functionKey());
		let cb = this.context.codeBlocks[func.codeBlockIndex];
		cb.codePushLocal(-5);
		if (lengthFunc.codeBlockIndex !== -1) {
			cb.codePush(1);
			cb.codeCall(lengthFunc.codeBlockIndex);
		} else {
			cb.codeExt(lengthFunc.internalIndex);
		}
		cb.codePush(1);
		cb.codeSub();
		cb.codeRet(1);
		this.context.addFunction(func);
		return func;
	}
	
	generateArrayIndexOfFunction(evalType) {
		let itemType = evalType.underlyingType;
		var func =  new EvalResultFunction(
			"index_of",
			new EvalResultParameterList(2, [
				new EvalResultParameter("item", itemType),
				new EvalResultParameter("array", evalType)]),
			EVAL_TYPE_INTEGER, 
			false
		);
		func.codeBlockIndex = this.context.addCodeBlock(func.functionKey());
		let cb = this.context.codeBlocks[func.codeBlockIndex];
		for (let i = 0; i < itemType.slotCount() + 1; i++) {
			cb.codePushLocal(-5 - itemType.slotCount() + i);
		}
		cb.codePush(itemType.slotCount());
		cb.codeExt(PLW_LOPCODE_GET_BLOB_INDEX_OF_ITEM);
		cb.codeRet(1);
		this.context.addFunction(func);
		return func;
	}
	
	generateFunctionCall(functionName, argCount, argTypes, expectedType = null) {
		let funcKey = EvalResultFunction.makeKey(functionName, argCount, argTypes);
		let func = this.context.getFunction(funcKey);
		if (func === null) {
			let variantIndex = -1;
			for (let i = 0; i < argCount; i++) {
				if (argTypes[i].tag === "res-type-variant") {
					variantIndex = i;
					break;
				}
			}
			if (variantIndex !== -1) {
				let genRes = this.generateVariantDispatchFunction(functionName, argCount, argTypes, variantIndex, expectedType);
				if (genRes.isError()) {
					return genRes;
				}
				func = this.context.getFunction(funcKey);
			} else {
				let macroFunc = this.context.findMacroFunction(functionName, argTypes);
				if (macroFunc !== null) {
					let genRes = this.generateFunctionFromMacro(functionName, argTypes, macroFunc);
					if (genRes.isError()) {
						return genRes;
					}
				}
				func = this.context.getFunction(funcKey);
			}
			if (func === null) {
				return EvalError.unknownFunction(funcKey);
			}
		}
		let argSlotCount = 0;
		for (let i = 0; i < argCount; i++) {
			argSlotCount += argTypes[i].slotCount();
		}
		if (func.nativeIndex !== -1) {
			this.codeBlock.codePush(argSlotCount);
			this.codeBlock.codeCallNative(func.nativeIndex);
		} else if (func.internalIndex !== -1) {
			this.codeBlock.codeExt(func.internalIndex);
		} else if (func.isGenerator === true) {
			this.codeBlock.codePush(argSlotCount);
			this.codeBlock.codePush(func.codeBlockIndex);
			this.codeBlock.codeExt(PLW_LOPCODE_CREATE_GENERATOR);
		} else {
			this.codeBlock.codePush(argSlotCount);
			this.codeBlock.codeCall(func.codeBlockIndex);
		}
		return func.isGenerator ? this.addType(new EvalTypeSequence(func.returnType)) : func.returnType;
	}
			
	generateFunctionFromMacro(functionName, argTypes, macroFunc) {
		let params = [];
		for (let i = 0; i < macroFunc.parameterList.parameterCount; i++) {
			params[i] = new AstParameter(
				macroFunc.parameterList.parameters[i].parameterName,
				argTypes[i].toAst());
		}
		let funcDecl = new AstFunctionDeclaration(
			macroFunc.functionName,
			new AstParameterList(macroFunc.parameterList.parameterCount, params),
			(macroFunc.returnType === EVAL_TYPE_ANY ? EVAL_TYPE_INFER : macroFunc.returnType).toAst(),
			macroFunc.astStmt,
			macroFunc.isGenerator);
		return this.evalStatement(funcDecl);
	}
	
	generateVariantDispatchFunction(functionName, argCount, argTypes, variantIndex, expectedType) {
		let params = [];
		for (let i = 0; i < argCount; i++) {
			params[i] = new AstParameter("arg" + i, argTypes[i].toAst());
		}
		let args = [];
		for (let i = 0; i < argCount; i++) {
			args[i] = new AstVariable(i == variantIndex ? "v" : "arg" + i);
		}
		let retVal = new AstFunction(functionName, new AstArgList(argCount, args));
		if (expectedType !== null) {
			retVal = new AstAs(retVal, expectedType.toAst());
		}
		let thenStmts = [new AstReturn(retVal)];
 		let thenExpr = new AstBlock(thenStmts.length, thenStmts, null);		
		let whens = [];
		for (let i = 0; i < argTypes[variantIndex].typeCount; i++) {
			whens[i] = new AstKindofWhenStmt(
				argTypes[variantIndex].types[i].toAst(),
				"v", thenExpr);
		}
		let funcDecl = new AstFunctionDeclaration(
			functionName,
			new AstParameterList(argCount, params),
			EVAL_TYPE_INFER.toAst(),
			new AstBlock(1, [ 
				new AstKindofStmt (
					new AstVariable("arg" + variantIndex),
					argTypes[variantIndex].typeCount,
					whens,
					null)],
				null),
			false);
		return this.evalStatement(funcDecl);
	}
	
	generateProcedureFromMacro(procedureName, argTypes, macroProc) {
		let params = [];
		for (let i = 0; i < macroProc.parameterList.parameterCount; i++) {
			params[i] = new AstParameter(
				macroProc.parameterList.parameters[i].parameterName,
				argTypes[i].toAst());
		}
		let procDecl = new AstProcedureDeclaration(
			macroProc.procedureName,
			new AstParameterList(macroProc.parameterList.parameterCount, params),
			macroProc.astStmt);
		return this.evalStatement(procDecl);
	}
	
	generateVariantDispatchProcedure(astProcCall, argTypes, variantIndex) {
		let params = [];
		for (let i = 0; i < astProcCall.argList.argCount; i++) {
			params[i] = new AstParameter("arg" + i, argTypes[i].toAst());
		}
		let args = [];
		for (let i = 0; i < astProcCall.argList.argCount; i++) {
			args[i] = new AstVariable(i === variantIndex ? "v" : "arg" + i);
		}
		let thenStmts = [new AstProcedure(astProcCall.procedureName, new AstArgList(astProcCall.argList.argCount, args))];
		let thenExpr = new AstBlock(thenStmts.length, thenStmts, null); 
		let whens = [];
		for (let i = 0; i < argTypes[variantIndex].typeCount; i++) {
			whens[i] = new AstKindofWhenStmt(
				argTypes[variantIndex].types[i].toAst(),
				"v", thenExpr);
		}
		let procDecl = new AstProcedureDeclaration(
			astProcCall.procedureName,
			new AstParameterList(astProcCall.argList.argCount, params),
			new AstBlock(1, [ 
				new AstKindofStmt (
					new AstVariable("arg" + variantIndex),
					argTypes[variantIndex].typeCount,
					whens,
					null)],
				null));
		return this.evalStatement(procDecl);
	}
	
	evalType(expr) {
		if (expr.tag === "ast-null") {
			return EVAL_TYPE_NULL;
		}
		if (expr.tag === "ast-type-named") {
			let evalType = this.context.getType(expr.typeName);
			if (evalType === null) {
				return EvalError.unknownType(expr.typeName).fromExpr(expr);
			}
			return evalType;
		}
		if (expr.tag === "ast-type-array") {
			let underType = this.evalType(expr.underlyingType);
			if (underType.isError()) {
				return underType;
			}
			if (underType === EVAL_TYPE_ANY) {
				return EvalError.wrongType(underType, "not any").fromExpr(expr.underlyingType);					
			}
			return this.addType(new EvalTypeArray(underType));
		}
		if (expr.tag === "ast-type-sequence") {
			let underType = this.evalType(expr.underlyingType);
			if (underType.isError()) {
				return underType;
			}
			if (underType === EVAL_TYPE_ANY) {
				return EvalError.wrongType(underType, "not any").fromExpr(expr.underlyingType);					
			}
			return this.addType(new EvalTypeSequence(underType));
		}
		if (expr.tag === "ast-type-record") {
			for (let i = 1; i < expr.fieldCount; i++) {
				for (let j = 0; j < i; j++) {
					if (expr.fields[i].fieldName === expr.fields[j].fieldName) {
						return EvalError.fieldAlreadyExists(expr.fields[i].fieldName).fromExpr(expr.fields[i]);
					}
				}
			}
			let fields = [];
			for (let i = 0; i < expr.fieldCount; i++) {
				let fieldType = this.evalType(expr.fields[i].fieldType);
				if (fieldType.isError()) {
					return fieldType;
				}
				if (fieldType === EVAL_TYPE_ANY) {
					return EvalError.wrongType(fieldType, "not any").fromExpr(expr.fields[i].fieldType);					
				}
				fields[i] = new EvalTypeRecordField(expr.fields[i].fieldName, fieldType);
			}
			return this.addType(new EvalTypeRecord(expr.fieldCount, fields));
		}
		if (expr.tag === "ast-type-variant") {
			let types = [];
			for (let i = 0; i < expr.typeCount; i++) {
				let type = this.evalType(expr.types[i]);
				if (type.isError()) {
					return type;
				}
				if (type === EVAL_TYPE_ANY) {
					return EvalError.wrongType(type, "not any").fromExpr(expr.types[i]);					
				}
				if (type.tag === "res-type-variant") {
					return EvalError.cantNestVariant(type.typeKey()).fromExpr(expr.types[i]);
				}
				if (types.indexOf(type) !== -1) {
					return EvalError.fieldAlreadyExists(type.typeKey()).fromExpr(expr.types[i]);
				}
				types[i] = type;
			}
			types.sort(function (a, b) { 
				if (a.typeKey() === b.typeKey()) return 0;
					if (a.typeKey() > b.typeKey()) return 1;
					return -1;
			});			
			return this.addType(new EvalTypeVariant(expr.typeCount, types));
		}
		if (expr.tag === "ast-type-tuple") {
			let types = [];
			for (let i = 0; i < expr.typeCount; i++) {
				let type = this.evalType(expr.types[i]);
				if (type.isError()) {
					return type;
				}
				if (type === EVAL_TYPE_ANY) {
					return EvalError.wrongType(type, "not any").fromExpr(expr.types[i]);					
				}
				types[i] = type;
			}
			return this.addType(new EvalTypeTuple(expr.typeCount, types));
		}
		return EvalError.unknownType(expr.tag).fromExpr(expr);
	}
	
	
	// The eval of a statement must return:
	//   EVAL_RESULT_RAISE if all paths raise an exception, else
	//   EVAL_RESULT_RETURN if all paths return or raise, else
	//   EVAL_RESULT_OK 
	evalStatement(expr) {
		if (expr.tag === "ast-type-declaration") {
			if (this.context.getType(expr.typeName) !== null) {
				return EvalError.typeAlreadyExists(expr.typeName).fromExpr(expr);
			}
			let underlyingType = this.evalType(expr.typeExpr);
			if (underlyingType.isError()) {
				return underlyingType;
			}
			if (underlyingType === EVAL_TYPE_ANY) {
				return EvalError.wrongType(underlyingType, "not any").fromExpr(expr.typeExpr);					
			}
			let namedType = new EvalTypeName(expr.typeName, underlyingType);
			this.addType(namedType);
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-variable-declaration") {
			for (let i = 0; i < expr.varNameCount; i++) {
				if (this.scope.getLocalVariable(expr.varNames[i]) !== null) {
					return EvalError.variableAlreadyExists(expr.varNames[i]).fromExpr(expr);
				}
			}
			let initValueType = this.eval(expr.valueExpr);
			if (initValueType.isError()) {
				return initValueType;
			}
			if (expr.varNameCount === 1) {
				this.scope.addVariable(expr.varNames[0], initValueType, expr.isConst);
				return EVAL_RESULT_OK;
			}
			let initStructType = initValueType.structuralType();
			if (initStructType.tag !== "res-type-tuple") {
				return EvalError.wrongType(initValueType, "tuple").fromExpr(expr.valueExpr);
			}					
			if (expr.varNameCount !== initStructType.typeCount) {
				return EvalError.tupleSizeMismatch(expr.varNameCount, initStructType.typeCount).fromExpr(expr.valueExpr);
			}
			for (let i = 0; i < expr.varNameCount; i++) {
				this.scope.addVariable(expr.varNames[i], initStructType.types[i], expr.isConst);
			}
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-assign") {
			if (expr.left.tag === "ast-variable") {
				// search the variable
				let variable = this.scope.getVariable(expr.left.varName);
				if (variable === null) {
					return EvalError.unknownVariable(expr.left.varName).fromExpr(expr.left);
				}
				if (variable.isConst) {
					return EvalError.cantMutateConst(expr.left.varName).fromExpr(expr.left);
				}
				// evaluate the value
				let valueType = this.eval(expr.right, variable.varType);
				if (valueType.isError()) {
					return valueType;
				}
				if (valueType !== variable.varType) {
					return EvalError.wrongType(valueType, variable.varType.typeKey()).fromExpr(expr.right);					
				}
				// assign the value
				if (variable.isGlobal) {
					for (let i = valueType.slotCount() - 1; i >= 0; i--) { 
						this.codeBlock.codePopGlobal(variable.offset + i);
					}
				} else {
					for (let i = valueType.slotCount() - 1; i >= 0; i--) { 
						this.codeBlock.codePopLocal(variable.offset + i);
					}
				}
				if (variable.stat !== null) {
					variable.stat.addReset();
				}
				return EVAL_RESULT_OK;
			}
			if (expr.left.tag === "ast-value-tuple") {
				let tupleExpr = expr.left;
				let variables = [];
				let variableTypes = [];
				for (let i = 0; i < tupleExpr.itemCount; i++) {
					if (tupleExpr.items[i].tag !== "ast-variable") {
						return EvalError.unassignable(expr.left.tag).fromExpr(expr.left);
					}
					let varName = tupleExpr.items[i].varName;
					let variable = this.scope.getVariable(varName);
					if (variable === null) {
						return EvalError.unknownVariable(varName).fromExpr(expr.left);
					}
					if (variable.isConst) {
						return EvalError.cantMutateConst(varName).fromExpr(expr.left);
					}
					variables[i] = variable;
					variableTypes[i] = variable.varType;					
				}
				let tupleType = this.addType(new EvalTypeTuple(tupleExpr.itemCount, variableTypes));
				// evaluate the value
				let valueType = this.eval(expr.right, tupleType);
				if (valueType.isError()) {
					return valueType;
				}
				if (valueType !== tupleType) {
					return EvalError.wrongType(valueType.types[i], variables[i].varType.typeKey()).fromExpr(expr.right);					
				}
				// assign the value
				for (let i = tupleExpr.itemCount - 1; i >= 0; i--) {
					if (variables[i].isGlobal) {
						this.codeBlock.codePopGlobal(variables[i].offset);
					} else {
						this.codeBlock.codePopLocal(variables[i].offset);
					}
					if (variables[i].stat !== null) {
						variables[i].stat.addReset();
					}
				}
				return EVAL_RESULT_OK;				
			}
			if (expr.left.tag === "ast-index") {
				let indexExpr = expr.left;
				// Evaluate the indexed ptr
				let indexedType = this.evalForMutate(indexExpr.indexed);
				if (indexedType.isError()) {
					return indexedType;
				}
				let structType = indexedType.structuralType();
				if (structType.tag !== "res-type-array") {
					return EvalError.wrongType(indexedType, "array").fromExpr(indexExpr.indexed);
				}
				let itemType = structType.underlyingType;
				// Evaluate the index
				let indexType = this.eval(indexExpr.index);
				if (indexType.isError()) {
					return indexType;
				}
				if (indexType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(indexType, "integer").fromExpr(indexExpr.index);
				}
				if (indexExpr.indexTo !== null) {
					return EvalError.unassignable(indexExpr.tag).fromExpr(indexExpr);
				}
				if (itemType.slotCount() > 1) {
					this.codeBlock.codePush(itemType.slotCount());
					this.codeBlock.codeMul();
				}
				// Evaluate the value to assign
				let valueType = this.eval(expr.right, itemType);
				if (valueType.isError()) {
					return valueType;
				}
				if (valueType !== itemType) {
					return EvalError.wrongType(valueType, itemType.typeKey()).fromExpr(expr.right);
				}
				// Assign the value
				this.codeBlock.codePush(itemType.slotCount());
				this.codeBlock.codeExt(PLW_LOPCODE_WRITE_BLOB);
				return EVAL_RESULT_OK;
			}
			if (expr.left.tag === "ast-field") {
				let fieldExpr = expr.left;
				// evaluate the record
				let recordType = this.evalForMutate(fieldExpr.expr);
				if (recordType.isError()) {
					return recordType;
				}
				let structType = recordType.structuralType();
				if (structType.tag != "res-type-record") {
					return EvalError.wrongType(recordType, "record").fromExpr(fieldExpr.expr);
				}
				// push the offset of the field
				let field = structType.getField(fieldExpr.fieldName);
				if (field === null) {
					return EvalError.unknownField(fieldExpr.fieldName, recordType.typeKey()).fromExpr(fieldExpr);
				}
				this.codeBlock.codePush(field.offset);
				// Evaluate the value to assign
				let valueType = this.eval(expr.right, field.fieldType);
				if (valueType.isError()) {
					return valueType;
				}
				if (valueType !== field.fieldType) {
					return EvalError.wrongType(valueType, field.fieldType.typeKey()).fromExpr(expr.right);
				}
				// Assigne the value
				this.codeBlock.codePush(field.fieldType.slotCount());
				this.codeBlock.codeExt(PLW_LOPCODE_WRITE_BLOB);
				return EVAL_RESULT_OK;
			}
			return EvalError.unassignable(expr.left.tag).fromExpr(expr.left);
		}
		if (expr.tag == "ast-block") {
			let ret = EVAL_RESULT_OK;
			let exceptionLoc = -1;
			this.pushScopeBlock();
			if (expr.exception !== null) {
				this.scope.clearVarStatTmp();
				exceptionLoc = this.codeBlock.codePush(0);
				this.codeBlock.codeExt(PLW_LOPCODE_CREATE_EXCEPTION_HANDLER);
				this.scope.addVariable("_exception_handler", EVAL_TYPE_EXCEPTION_HANDLER, true);
			}
			for (let i = 0; i < expr.statementCount; i++) {
				if (ret !== EVAL_RESULT_OK) {
					return EvalError.unreachableCode().fromExpr(expr.statements[i]);
				}
				ret = this.evalStatement(expr.statements[i]);
				if (ret.isError()) {
					return ret;
				}
			}
			if (ret === EVAL_RESULT_OK) {
				if (this.scope.variableOffset > 0) {
					this.codeBlock.codePopVoid(this.scope.variableOffset);
				}
			}
			this.popScope();
			if (expr.exception === null) {
				return ret;
			}
			let endLoc = -1;
			if (ret === EVAL_RESULT_OK) {
				endLoc = this.codeBlock.codeJmp(0);
			}
			this.codeBlock.setLoc(exceptionLoc);
			this.scope.clearVarStatTmp();
			let exRet = this.evalStatement(expr.exception);
			if (exRet.isError()) {
				return exRet;
			}
			this.scope.clearVarStatTmp();
			if (endLoc !== -1) {
				this.codeBlock.setLoc(endLoc);
			}
			if (ret === EVAL_RESULT_RAISE) {
				return exRet;
			}
			if (ret === EVAL_RESULT_RETURN && exRet !== EVAL_RESULT_OK) {
				return ret;
			}
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-exception") {
			this.pushScopeBlock();
			let exceptionVar = this.scope.addVariable("_exception_value", EVAL_TYPE_INTEGER, false);
			let endLocs = [];
			let endLocCount = 0;
			let ret = null;
			for (let i = 0; i < expr.whenStmtCount; i++) {
				let whenStmt = expr.whenStmts[i];
				if (whenStmt.tag !== "ast-when-statement") {
					return EvalError.unknownType(whenStmt.tag).fromExpr(expr);
				}
				this.codeBlock.codePushLocal(exceptionVar.offset);
				let whenType = this.eval(whenStmt.whenExpr);
				if (whenType.isError()) {
					return whenType;
				}
				if (whenType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(whenType, "integer").fromExpr(whenStmt.whenExpr);	
				}
				this.codeBlock.codeEq(whenType.slotCount());
				let nextLoc = this.codeBlock.codeJz(0);
				this.scope.clearVarStatTmp();
				let stmtRes = this.evalStatement(whenStmt.statement);
				if (stmtRes.isError()) {
					return stmtRes;
				}
				this.scope.clearVarStatTmp();
				if (
					(ret === null || stmtRes === EVAL_RESULT_OK) ||
					(stmtRes === EVAL_RESULT_RETURN && ret === EVAL_RESULT_RAISE)
				) {
					ret = stmtRes;
				}
				if (stmtRes == EVAL_RESULT_OK) {
					endLocs[endLocCount] = this.codeBlock.codeJmp(0);
					endLocCount++;
				}
				this.codeBlock.setLoc(nextLoc);
			}
			if (expr.defaultStmt === null) {
				if (ret === null) {
					ret = EVAL_RESULT_RAISE;
				}
				this.codeBlock.codeExt(PLW_LOPCODE_RAISE_EXCEPTION);
			} else {
				this.scope.clearVarStatTmp();
				let stmtRes = this.evalStatement(expr.defaultStmt);
				if (stmtRes.isError()) {
					return stmtRes;
				}
				this.scope.clearVarStatTmp();
				if (
					(ret === null || stmtRes === EVAL_RESULT_OK) ||
					(stmtRes === EVAL_RESULT_RETURN && ret === EVAL_RESULT_RAISE)
				) {
					ret = stmtRes;
				}
			}
			for (let i = 0; i < endLocCount; i++) {
				this.codeBlock.setLoc(endLocs[i]);
			}
			if (ret === null) {
				ret = EVAL_RESULT_OK;
			}
			if (ret === EVAL_RESULT_OK) {
				if (this.scope.variableOffset > 0) {
					this.codeBlock.codePopVoid(this.scope.variableOffset);
				}
			}
			this.popScope();			
			return ret;
		}
		if (expr.tag === "ast-if") {
			let condType = this.eval(expr.condition);
			if (condType.isError()) {
				return condType;
			}
			if (condType !== EVAL_TYPE_BOOLEAN) {
				return EvalError.wrongType(condType, "boolean").fromExpr(expr.condition);	
			}
			let falseLoc = this.codeBlock.codeJz(0);
			this.scope.clearVarStatTmp();
			let trueRet =  this.evalStatement(expr.trueStatement);
			if (trueRet.isError()) {
				return trueRet;
			}
			this.scope.clearVarStatTmp();
			let endLoc = expr.falseStatement === null ? -1 : this.codeBlock.codeJmp(0);
			this.codeBlock.setLoc(falseLoc);
			if (expr.falseStatement === null) {
				return EVAL_RESULT_OK;
			}
			let falseRet = this.evalStatement(expr.falseStatement);
			if (falseRet.isError()) {
				return falseRet;
			}
			this.scope.clearVarStatTmp();
			this.codeBlock.setLoc(endLoc);
			if (trueRet === EVAL_RESULT_RAISE && falseRet === EVAL_RESULT_RAISE) {
				return EVAL_RESULT_RAISE; 
			}
			if (
				(trueRet === EVAL_RESULT_RETURN && falseRet !== EVAL_RESULT_OK) ||
				(falseRet === EVAL_RESULT_RETURN && trueRet !== EVAL_RESULT_OK)
			) {
				return EVAL_RESULT_RETURN;
			}
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-kindof-stmt") {
			let caseType = this.eval(expr.caseExpr);
			if (caseType.isError()) {
				return caseType;
			}
			if (caseType.structuralType().tag !== "res-type-variant") {
				return EvalError.wrongType(caseType, "variant").fromExpr(expr.caseExpr);
			}
			let kindHasWhen = [];
			let returnCount = 0;
			for (let i = 0; i < caseType.structuralType().typeCount; i++) {
				kindHasWhen[i] = false;
			}
			let endLocs = [];
			let endLocCount = 0;
			for (let i = 0; i < expr.whenCount; i++) {
				// Duplicate the last slot of the variant which is the variantType
				this.codeBlock.codeDup(1);
				let whenType = this.evalType(expr.whens[i].type);
				if (whenType.isError()) {
					return whenType;
				}
				let typeIndex = caseType.structuralType().types.indexOf(whenType);
				if (typeIndex === -1) {
					return EvalError.unknownVariantKind(whenType.typeKey()).fromExpr(expr.whens[i]);
				}
				if (kindHasWhen[typeIndex] === true) {
					return EvalError.variantKindAlreadyManaged(whenType.typeKey()).fromExpr(expr.whens[i]);
				}
				kindHasWhen[typeIndex] = true;
				// Compare the variant type with the when type
				this.codeBlock.codePush(whenType.globalId);
				this.codeBlock.codeEq(1);
				// If false, loop						
				let nextLoc = this.codeBlock.codeJz(0);
				// If true, resize the variant to the actual type size to make the when var
				this.codeBlock.codePopVoid(caseType.slotCount() - whenType.slotCount());
				this.pushScopeBlock();
				this.scope.addVariable(expr.whens[i].varName, whenType, false);
				this.scope.clearVarStatTmp();
				let thenRet = this.evalStatement(expr.whens[i].thenBlock);
				if (thenRet.isError()) {
					return thenRet;
				}
				this.scope.clearVarStatTmp();
				if (thenRet === EVAL_RESULT_RETURN) {
					returnCount++;
				}
				// Pop the when var
				this.codeBlock.codePopVoid(whenType.slotCount());
				this.popScope();
				// It is done, goto end
				endLocs[endLocCount] = this.codeBlock.codeJmp(0);
				endLocCount++;
				this.codeBlock.setLoc(nextLoc);
			}
			// No match, we still have the case var on the stack, we pop it
			this.codeBlock.codePopVoid(caseType.slotCount());
			// Execute the else statement if there is one
			if (expr.elseBlock !== null) {
				this.scope.clearVarStatTmp();
				let elseRet = this.evalStatement(expr.elseBlock);
				if (elseRet.isError()) {
					return elseRet;
				}
				this.scope.clearVarStatTmp();
				if (elseRet === EVAL_RESULT_RETURN) {
					for (let i = 0; i < kindHasWhen.length; i++) {
						if (kindHasWhen[i] === false) {
							returnCount++;
						}
					}
				}
			}
			for (let i = 0; i < endLocCount; i++) {
				this.codeBlock.setLoc(endLocs[i]);
			}
			return returnCount === kindHasWhen.length ? EVAL_RESULT_RETURN : EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-while") {
			this.pushScopeLoop();
			let testLoc = this.codeBlock.codeSize;
			let conditionType = this.eval(expr.condition);
			if (conditionType.isError()) {
				return conditionType;
			}
			if (conditionType !== EVAL_TYPE_BOOLEAN) {
				return EvalError.wrongType(conditionType, "boolean").fromExpr(expr.condition);	
			}
			let endLoc = this.codeBlock.codeJz(0);
			this.scope.clearVarStatTmp();
			let stmtRet = this.evalStatement(expr.statement);
			if (stmtRet.isError()) {
				return stmtRet;
			}
			this.scope.clearVarStatTmp();
			this.codeBlock.codeJmp(testLoc);
			this.codeBlock.setLoc(endLoc);
			for (let i = 0; i < this.scope.exitLocCount; i++) {
				this.codeBlock.setLoc(this.scope.exitLocs[i]);
			}
			this.popScope();
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-for") {
			if (expr.sequence.tag === "ast-range") {
				this.pushScopeLoop();
				let startBoundExpr = expr.isReverse ? expr.sequence.upperBound : expr.sequence.lowerBound;
				let endBoundExpr = expr.isReverse ? expr.sequence.lowerBound : expr.sequence.upperBound;				
				let endBoundType = this.eval(endBoundExpr);
				if (endBoundType.isError()) {
					return endBoundType;
				}
				if (endBoundType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(endBoundType, "integer").fromExpr(endBoundExpr);
				}
				let endBoundVar = this.scope.addVariable("_for_range_end_bound", EVAL_TYPE_INTEGER, false);
				let startBoundType = this.eval(startBoundExpr);
				if (startBoundType.isError()) {
					return startBoundType;
				}
				if (startBoundType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(startBoundType, "integer").fromExpr(startBoundExpr);
				}
				let indexVar = this.scope.addVariable(expr.index, EVAL_TYPE_INTEGER, false);
				let testLoc = this.codeBlock.codeSize;
				this.codeBlock.codePushLocal(indexVar.offset);
				this.codeBlock.codePushLocal(endBoundVar.offset);
				if (expr.isReverse) {
					this.codeBlock.codeGte();
				} else {
					this.codeBlock.codeLte();
				}
				let endLoc = this.codeBlock.codeJz(0);
				this.scope.clearVarStatTmp();
				let stmtRet = this.evalStatement(expr.statement);
				if (stmtRet.isError()) {
					return stmtRet;
				}
				this.scope.clearVarStatTmp();
				this.codeBlock.codePush(1);
				if (expr.isReverse) {
					this.codeBlock.codeSub();
				} else {
					this.codeBlock.codeAdd();
				}
				this.codeBlock.codeJmp(testLoc);
				this.codeBlock.setLoc(endLoc);
				for (let i = 0; i < this.scope.exitLocCount; i++) {
					this.codeBlock.setLoc(this.scope.exitLocs[i]);
				}
				if (this.scope.variableOffset > 0) {
					this.codeBlock.codePopVoid(this.scope.variableOffset);
				}
				this.popScope();
				return EVAL_RESULT_OK;
			} else {
				this.pushScopeLoop();
				let sequence = this.eval(expr.sequence);
				if (sequence.isError()) {
					return sequence;
				}
				sequence = sequence.structuralType();
				if (sequence.tag == "res-type-sequence") {
					let sequenceVar = this.scope.addVariable("_for_sequence", sequence, false);
					this.codeBlock.codePushLocal(sequenceVar.offset);
					this.codeBlock.codeExt(PLW_LOPCODE_GET_GENERATOR_NEXT_ITEM);
					let indexVar = this.scope.addVariable(expr.index, sequence.underlyingType, false);
					let testLoc = this.codeBlock.codeSize;
					this.codeBlock.codePushLocal(sequenceVar.offset);
					this.codeBlock.codeExt(PLW_LOPCODE_HAS_GENERATOR_ENDED);
					let endLoc = this.codeBlock.codeJnz(0);
					this.scope.clearVarStatTmp();
					let stmtRet = this.evalStatement(expr.statement);
					if (stmtRet.isError()) {
						return stmtRet;
					}
					this.scope.clearVarStatTmp();
					this.codeBlock.codePushLocal(sequenceVar.offset);
					this.codeBlock.codeExt(PLW_LOPCODE_GET_GENERATOR_NEXT_ITEM);
					for (let i = 0; i < sequence.underlyingType.slotCount(); i++) {
						this.codeBlock.codePopLocal(indexVar.offset + sequence.underlyingType.slotCount() - 1 - i);
					}
					this.codeBlock.codeJmp(testLoc);
					this.codeBlock.setLoc(endLoc);
				} else if (sequence.tag === "res-type-array") {
					let arrayVar = this.scope.addVariable("_for_array", sequence, false);
					let itemType = sequence.underlyingType;
					// Get the last_index of the array, multiply it by the itemSize
					this.codeBlock.codeDup(1);
					let lengthType = this.generateFunctionCall("last_index", 1, [sequence], EVAL_TYPE_INTEGER);
					if (lengthType.isError()) {
						return lengthType.fromExpr(expr);
					}
					if (lengthType !== EVAL_TYPE_INTEGER) {
						return EvalError.wrongType(lengthType, "integer").fromExpr(expr);
					}
					if (itemType.slotCount() > 1) {
						this.codeBlock.codePush(itemType.slotCount());
						this.codeBlock.codeMul();
					}
					let lastIndexVar = this.scope.addVariable("_for_last_index", EVAL_TYPE_INTEGER, false);
					// Create a variable for the item
					for (let i = 0; i < itemType.slotCount(); i++) {
						this.codeBlock.codePush(0);
					}
					let itemVar = this.scope.addVariable(expr.index, sequence.underlyingType, false);
					// Initialize the counter, 0 or last_index * itemSize if reverse
					if (expr.isReverse === true) {
						this.codeBlock.codePushLocal(lastIndexVar.offset);
					} else {
						this.codeBlock.codePush(0);
					}
					let indexVar = this.scope.addVariable("_for_index", EVAL_TYPE_INTEGER, false);
					// Begin of the loop
					let testLoc = this.codeBlock.codeSize;
					// Test the counter <= last_index * itemSize, or >= 0 if reverse
					this.codeBlock.codePushLocal(indexVar.offset);
					if (expr.isReverse === true) {
						this.codeBlock.codePush(0);
						this.codeBlock.codeGte();
					} else {
						this.codeBlock.codePushLocal(lastIndexVar.offset);
						this.codeBlock.codeLte();
					}
					// If no, go to the end of the loop
					let endLoc = this.codeBlock.codeJz(0);
					// Get the item in the array at the counter index
					this.codeBlock.codePushLocal(arrayVar.offset);
					this.codeBlock.codePushLocal(indexVar.offset);
					this.codeBlock.codePush(sequence.underlyingType.slotCount());
					this.codeBlock.codeExt(PLW_LOPCODE_READ_BLOB);
					// Set the item variable
					for (let i = 0; i < itemType.slotCount(); i++) {
						this.codeBlock.codePopLocal(itemVar.offset + itemType.slotCount() - i - 1);
					}
					// Evaluate the loop statement
					this.scope.clearVarStatTmp();
					let stmtRet = this.evalStatement(expr.statement);
					if (stmtRet.isError()) {
						return stmtRet;
					}
					this.scope.clearVarStatTmp();
					// Increment the counter, decrement if reverse
					this.codeBlock.codePush(itemType.slotCount());
					if (expr.isReverse === true) {
						this.codeBlock.codeSub();
					} else {
						this.codeBlock.codeAdd();
					}
					// Go to at the beginning of the loop
					this.codeBlock.codeJmp(testLoc);
					// End of the loop
					this.codeBlock.setLoc(endLoc);
				} else {
					return EvalError.wrongType(sequence, "sequence or array").fromExpr(expr.sequence);
				}	
				for (let i = 0; i < this.scope.exitLocCount; i++) {
					this.codeBlock.setLoc(this.scope.exitLocs[i]);
				}
				if (this.scope.variableOffset > 0) {
					this.codeBlock.codePopVoid(this.scope.variableOffset);
				}
				this.popScope();
				return EVAL_RESULT_OK;
			}
			return EvalError.unknownType(expr.sequence.tag).fromExpr(expr.sequence);
		}
		if (expr.tag === "ast-exit") {
			let currentScope = this.scope;
			let variableOffset = 0;
			while (currentScope !== null && currentScope.isLoop == false) {
				variableOffset += currentScope.variableOffset;
				currentScope = currentScope.parent; 
			}
			if (currentScope === null) {
				return EvalError.unexpectedExit().fromExpr(expr);
			}
			if (expr.condition === null) {
				if (variableOffset > 0) {
					this.codeBlock.codePopVoid(variableOffset);
				}
				currentScope.exitLocs[currentScope.exitLocCount] = this.codeBlock.codeJmp(0);
				currentScope.exitLocCount++;
			} else {
				let condType = this.eval(expr.condition);
				if (condType.isError()) {
					return condType;
				}
				if (condType !== EVAL_TYPE_BOOLEAN) {
					return EvalError.wrongType(condType, "boolean").fromExpr(expr.condition);	
				}
				let falseLoc = this.codeBlock.codeJz(0);
				if (variableOffset > 0) {
					this.codeBlock.codePopVoid(variableOffset);
				}
				currentScope.exitLocs[currentScope.exitLocCount] = this.codeBlock.codeJmp(0);
				currentScope.exitLocCount++;
				this.codeBlock.setLoc(falseLoc);
			}
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-raise") {
			let raiseType = this.eval(expr.expr);
			if (raiseType.isError()) {
				return raiseType;
			}
			if (raiseType !== EVAL_TYPE_INTEGER) {
				return EvalError.wrongType(raiseType, "integer").fromExpr(expr.expr);
			}
			this.codeBlock.codeExt(PLW_LOPCODE_RAISE_EXCEPTION);
			return EVAL_RESULT_RAISE;
		}
		if (expr.tag === "ast-return") {
			// Eval the returned expression
			let retType = null;
			if (expr.expr !== null) {
				retType = this.eval(expr.expr);
				if (retType.isError()) {
					return retType;
				}
			}
			// Find frame scope
			let frameScope = this.scope.findFrame();
			if (frameScope === null || frameScope.isGenerator !== false) {
				return EvalError.unexpectedReturn().fromExpr(expr);
			}
			// Check the return type
			if (retType === null && frameScope.returnType !== null) {
				return EvalError.unexpectedReturnWithoutValue().fromExpr(expr);
			}
			if (retType !== null && frameScope.returnType === null) {
				return EvalError.unexpectedReturnWithValue().fromExpr(expr);
			}
			if (frameScope.returnType === EVAL_TYPE_INFER) {
				frameScope.returnType = retType;
			} else if (retType !== frameScope.returnType) {
				return EvalError.wrongType(retType, frameScope.returnType.typeKey()).fromExpr(expr.expr);
			}
			this.codeBlock.codeRet(retType === null ? 0 : retType.slotCount());
			return EVAL_RESULT_RETURN;
		}
		if (expr.tag === "ast-yield") {
			// Check that the frame is a generator
			let frameScope = this.scope.findFrame();
			if (frameScope === null || frameScope.isGenerator !== true) {
				return EvalError.unexpectedYield().fromExpr(expr);
			}
			// Eval the returned expression
			let retType = this.eval(expr.expr);
			if (retType.isError()) {
				return retType;
			}
			// Check the return type
			if (retType !== frameScope.returnType) {
				return EvalError.wrongType(retType, frameScope.returnType.typeKey()).fromExpr(expr.expr);
			}
			this.codeBlock.codePush(retType.slotCount());
			this.codeBlock.codeExt(PLW_LOPCODE_YIELD_GENERATOR_ITEM);
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-function-declaration") {
			let parameterList = this.evalParameterList(expr.parameterList);
			if (parameterList.isError(parameterList)) {
				return parameterList;
			}
			let returnType = this.evalType(expr.returnType);
			if (returnType.isError()) {
				return returnType;
			}
			if (parameterList.indexOfAny() !== -1) {
				let macroFunc = new EvalResultMacroFunction(expr.functionName, parameterList, returnType, expr.isGenerator, expr.statement);
				if (this.context.getMacroFunction(macroFunc.functionShortKey(), macroFunc.functionKey()) !== null) {
					return EvalError.functionAlreadyExists(macroFunc.functionKey()).fromExpr(expr);
				}
				this.context.addMacroFunction(macroFunc);
				return EVAL_RESULT_OK;
			}
			let evalFunc = new EvalResultFunction(expr.functionName, parameterList, returnType, expr.isGenerator);
			if (this.context.getFunction(evalFunc.functionKey()) !== null) {
				return EvalError.functionAlreadyExists(evalFunc.functionKey()).fromExpr(expr);
			}
			this.context.addFunction(evalFunc);
			{ // begin Compile function
				let oldCodeBlock = this.codeBlock;
				let codeBlockIndex = this.context.addCodeBlock(evalFunc.functionKey());
				this.codeBlock = this.context.codeBlocks[codeBlockIndex];
				evalFunc.codeBlockIndex = codeBlockIndex;
				this.pushScopeFunction(evalFunc.isGenerator, returnType);
				if (evalFunc.isGenerator === true) {
					for (let i = 0; i < parameterList.parameterCount; i++) {
						this.scope.addVariable(
							parameterList.parameters[i].parameterName,
							parameterList.parameters[i].parameterType,
							false
						);
					}
				} else {
					for (let i = 0; i < parameterList.parameterCount; i++) {
						this.scope.addParameter(
							parameterList.parameters[i].parameterName,
							parameterList.parameters[i].parameterType);
					}
					this.scope.endAddParameter();
				}
				let ret = this.evalStatement(expr.statement);
				if (ret.isError()) {
					this.context.removeFunction(evalFunc.functionKey());
					return ret;
				}
				if (evalFunc.isGenerator === true) {
					for (let i = 0; i < returnType.slotCount(); i++) {
						this.codeBlock.codePush(0);
					}
					this.codeBlock.codePush(returnType.slotCount());
					this.codeBlock.codeExt(PLW_LOPCODE_YIELD_GENERATOR_ITEM);
				} else if (ret !== EVAL_RESULT_RETURN) {
					this.context.removeFunction(evalFunc.functionKey());
					return EvalError.noFunctionReturn(evalFunc.functionKey()).fromExpr(expr.statement);
				}
				if (evalFunc.returnType === EVAL_TYPE_INFER) {
					evalFunc.returnType = this.scope.returnType;
				}
				this.popScope();
				this.codeBlock = oldCodeBlock;
			} // End Compile function
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-procedure-declaration") {
			let parameterList = this.evalParameterList(expr.parameterList);
			if (parameterList.isError(parameterList)) {
				return parameterList;
			}
			if (parameterList.indexOfAny() !== -1) {
				let macroProc = new EvalResultMacroProcedure(expr.procedureName, parameterList, expr.statement);
				if (this.context.getMacroProcedure(macroProc.procedureShortKey(), macroProc.procedureKey()) !== null) {
					return EvalError.procedureAlreadyExists(macroProc.procedureKey()).fromExpr(expr);
				}
				this.context.addMacroProcedure(macroProc);
				return EVAL_RESULT_OK;
			}			
			let evalProc = new EvalResultProcedure(expr.procedureName, parameterList);
			if (this.context.getProcedure(evalProc.procedureKey()) !== null) {
				return EvalError.procedureAlreadyExists(evalProc.procedureKey()).fromExpr(expr);
			}
			this.context.addProcedure(evalProc);
			{ // begin Compile procedure
				let oldCodeBlock = this.codeBlock;
				let codeBlockIndex = this.context.addCodeBlock(evalProc.procedureKey());
				this.codeBlock = this.context.codeBlocks[codeBlockIndex];
				evalProc.codeBlockIndex = codeBlockIndex;
				this.pushScopeProcedure();
				for (let i = 0; i < parameterList.parameterCount; i++) {
					this.scope.addParameter(
						parameterList.parameters[i].parameterName,
						parameterList.parameters[i].parameterType);
				}
				this.scope.endAddParameter();
				let ret = this.evalStatement(expr.statement);
				if (ret.isError()) {
					this.context.removeProcedure(evalProc.procedureKey());
					return ret;
				}
				this.codeBlock.codeRet(0);
				this.popScope();
				this.codeBlock = oldCodeBlock;
			} // End Compile procedure
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-procedure") {
			let argTypes = [];
			let argSlotCount = 0;
			for (let i = 0; i < expr.argList.argCount; i++) {
				let argType = this.eval(expr.argList.args[i]);
				if (argType.isError()) {
					return argType;
				}
				argTypes[i] = argType;
				argSlotCount += argType.slotCount();
			}
			let procKey = expr.procedureName + "(";
			for (let i = 0; i < expr.argList.argCount; i++) {
				procKey += (i > 0 ? "," : "") + argTypes[i].typeKey();
			}
			procKey += ")";
			let proc = this.context.getProcedure(procKey);
			if (proc === null) {
				let variantIndex = -1;
				for (let i = 0; i < expr.argList.argCount; i++) {
					if (argTypes[i].tag === "res-type-variant") {
						variantIndex = i;
						break;
					}
				}
				if (variantIndex !== -1) {
					let genRes = this.generateVariantDispatchProcedure(expr, argTypes, variantIndex);
					if (genRes.isError()) {
						return genRes.fromExpr(expr);
					}
					proc = this.context.getProcedure(procKey);
				} else {
					let macroProc = this.context.findMacroProcedure(expr.procedureName, argTypes);
					if (macroProc !== null) {
						let genRes = this.generateProcedureFromMacro(expr.procedureName, argTypes, macroProc);
						if (genRes.isError()) {
							return genRes.fromExpr(expr);
						}
					}
					proc = this.context.getProcedure(procKey);
				}
				if (proc === null) {
					return EvalError.unknownProcedure(procKey).fromExpr(expr);
				}
			}
			this.codeBlock.codePush(argSlotCount);
			if (proc.nativeIndex !== -1) {
				this.codeBlock.codeCallNative(proc.nativeIndex);
			} else {
				this.codeBlock.codeCall(proc.codeBlockIndex);
			}
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-directive") {
			if (expr.text === "suspend") {
				this.codeBlock.codeSuspend();
			}
			return EVAL_RESULT_OK;
		}
		return EvalError.unknownType(expr.tag).fromExpr(expr);
	}
	
	evalForMutate(expr) {
		if (expr.tag === "ast-variable") {
			let v = this.scope.getVariable(expr.varName);
			if (v === null) {
				return EvalError.unknownVariable(expr.varName).fromExpr(expr);
			}
			if (v.isConst) {
				return EvalError.cantMutateConst(expr.varName).fromExpr(expr);
			}
			if (v.isGlobal) {
				this.codeBlock.codePushGlobalForMutate(v.offset);
			} else {
				this.codeBlock.codePushLocalForMutate(v.offset);
			}
			if (v.stat !== null) {
				v.stat.addReadLoc(this.codeBlock.currentLoc() - 1, expr);
			}
			return v.varType;
		}
		if (expr.tag === "ast-index") {
			// evaluate the array ref
			let indexedType = this.evalForMutate(expr.indexed);
			if (indexedType.isError()) {
				return indexedType;
			}
			let structType = indexedType.structuralType();
			if (structType.tag !== "res-type-array") {
				return EvalError.wrongType(indexedType, "array").fromExpr(expr.indexed);
			}
			if (structType.underlyingType.slotCount() > 1) {
				return EvalError.unassignable(expr.tag).fromExpr(expr);
			}
			// evaluate the index
			let indexType = this.eval(expr.index);
			if (indexType.isError()) {
				return indexType;
			}
			if (indexType !== EVAL_TYPE_INTEGER) {
				return EvalError.wrongType(indexType, "integer").fromExpr(expr.index);
			}
			if (expr.indexTo !== null) {
				return EvalError.unassignable(expr.tag).fromExpr(expr);
			}
			// push the result on the stack
			this.codeBlock.codeExt(PLW_LOPCODE_GET_BLOB_MUTABLE_OFFSET);
			return structType.underlyingType;
		}
		if (expr.tag === "ast-field") {
			let recordType = this.evalForMutate(expr.expr);
			if (recordType.isError()) {
				return recordType;
			}
			let structType = recordType.structuralType();
			if (structType.tag != "res-type-record") {
				return EvalError.wrongType(recordType, "record").fromExpr(expr.expr);
			}
			let field = structType.getField(expr.fieldName);
			if (field === null) {
				return EvalError.unknownField(expr.fieldName, recordType.typeKey()).fromExpr(expr);
			}
			if (field.fieldType.slotCount() > 1) {
				return EvalError.unassignable(expr.tag).fromExpr(expr);
			}
			this.codeBlock.codePush(field.offset);
			this.codeBlock.codeExt(PLW_LOPCODE_GET_BLOB_MUTABLE_OFFSET);
			return field.fieldType;
		}
		return EvalError.unassignable(expr.tag).fromExpr(expr);
	}
	
	eval(expr, expectedType = null) {
		if (expr.tag === "ast-as") {
			let asType = this.evalType(expr.exprType);
			if (asType.isError()) {
				return asType;
			}
			if (asType === EVAL_TYPE_ANY) {
				return EvalError.wrongType(asType, "not any").fromExpr(expr.exprType);				
			}
			let valueType = this.eval(expr.expr, asType);
			if (valueType.isError()) {
				return valueType;
			}
			if (valueType === asType || valueType.structuralType() === asType.structuralType()) {
				return asType;
			}
			if (asType.structuralType().tag === "res-type-variant" && asType.structuralType().contains(valueType)) {
				if (valueType.tag !== "res-type-variant") {
					for (let i = 0; i < asType.structuralType().slotCount() - valueType.slotCount() - 1; i++) {
						this.codeBlock.codePush(0);
					}
					this.codeBlock.codePush(valueType.globalId);
				}
				return asType;
			}
			return EvalError.wrongType(valueType, asType.typeKey()).fromExpr(expr.expr);				
		}
		if (expr.tag === "ast-value-boolean") {
			this.codeBlock.codePush(expr.boolValue ? 1 : 0);
			return EVAL_TYPE_BOOLEAN;
		}
		if (expr.tag === "ast-null") {
			return EVAL_TYPE_NULL;
		}
		if (expr.tag === "ast-value-integer") {
			this.codeBlock.codePush(expr.intValue);
			return EVAL_TYPE_INTEGER;
		}
		if (expr.tag === "ast-value-real") {
			let floatId = this.codeBlock.addFloatConst(expr.realValue);
			this.codeBlock.codePushf(floatId);
			return EVAL_TYPE_REAL;
		}
		if (expr.tag === "ast-value-text") {
			if (expectedType === EVAL_TYPE_CHAR && expr.textValue.length === 1) {
				this.codeBlock.codePush(expr.textValue.charCodeAt(0));
				return EVAL_TYPE_CHAR;
			}
			let strId = this.codeBlock.addStrConst(expr.textValue);
			this.codeBlock.codePush(strId);
			this.codeBlock.codeExt(PLW_LOPCODE_CREATE_STRING);
			return EVAL_TYPE_TEXT;
		}
		if (expr.tag === "ast-value-tuple") {
			let itemTypes = [];
			for (let i = 0; i < expr.itemCount; i++) {
				let itemType = this.eval(expr.items[i]);
				if (itemType.isError()) {
					return itemType;
				}
				itemTypes[i] = itemType;
			}
			return this.addType(new EvalTypeTuple(expr.itemCount, itemTypes));
		}
		if (expr.tag === "ast-value-array") {
			if (expr.itemCount === 0) {
				if (expectedType === null) {
					return EvalError.emptyArrayMustBeTyped().fromExpr(expr);
				} else {
					if (expectedType.structuralType().tag !== "res-type-array") {
						return EvalError.wrongType(expectedType, "array").fromExpr(expr);				
					}
					this.codeBlock.codePush(0);
					this.codeBlock.codeExt(PLW_LOPCODE_CREATE_BLOB);
					return expectedType;
				}
			}
			let itemType = null;
			// Evalute the next items
			for (let i = 0; i < expr.itemCount; i++) {
				let currentItemType = this.eval(expr.items[i]);
				if (currentItemType.isError()) {
					return currentItemType;
				}
				if (itemType === null) {
					itemType = currentItemType;
				} else if (currentItemType !== itemType) {
					return EvalError.wrongType(currentItemType, itemType.typeKey()).fromExpr(expr.items[i]);
				}
			}
			// Allocate the array
			this.codeBlock.codePush(expr.itemCount * itemType.slotCount());
			this.codeBlock.codeExt(PLW_LOPCODE_CREATE_BLOB);
			return this.addType(new EvalTypeArray(itemType));
		}
		if (expr.tag === "ast-value-record") {
			let fields = [];
			for (let i = 0; i < expr.fieldCount; i++) {
				let fieldValueType = this.eval(expr.fields[i].valueExpr);
				if (fieldValueType.isError()) {
					return fieldValueType;
				}
				fields[i] = new EvalTypeRecordField(expr.fields[i].fieldName, fieldValueType);
			}
			let recordType = this.addType(new EvalTypeRecord(expr.fieldCount, fields));
			this.codeBlock.codePush(recordType.fieldSlotCount);
			this.codeBlock.codeExt(PLW_LOPCODE_CREATE_BLOB);
			return recordType;
		}
		if (expr.tag === "ast-concat") {
			let firstItemType = null;
			for (let i = 0; i < expr.itemCount; i++) {
				let itemType = this.eval(expr.items[i]);
				if (itemType.isError()) {
					return itemType;
				}
				if (itemType.structuralType() !== EVAL_TYPE_TEXT && itemType.structuralType().tag !== "res-type-array") {
					return EvalError.wrongType(itemType, "text or array").fromExpr(expr.items[i]);
				}
				if (i === 0) {
					firstItemType = itemType;
				} else if (firstItemType !== itemType) {
					return EvalError.wrongType(itemType, firstItemType.typeKey()).fromExpr(expr.items[i]);
				}
			}
			this.codeBlock.codePush(expr.itemCount);
			if (firstItemType.structuralType() === EVAL_TYPE_TEXT) {
				this.codeBlock.codeExt(PLW_LOPCODE_CONCAT_STRING);
			} else {
				this.codeBlock.codeExt(PLW_LOPCODE_CONCAT_BLOB);
			}
			return firstItemType;
		}
		if (expr.tag === "ast-operator-binary") {
			if (expr.operator === TOK_AND || expr.operator === TOK_OR) {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				if (leftType !== EVAL_TYPE_BOOLEAN) {
					return EvalError.wrongType(leftType, "boolean").fromExpr(expr.left);
				}
				let skipLoc = expr.operator === TOK_AND ? this.codeBlock.codeJz(0) : this.codeBlock.codeJnz(0);
				let rightType = this.eval(expr.right);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType !== EVAL_TYPE_BOOLEAN) {
					return EvalError.wrongType(rightType, "boolean").fromExpr(expr.right);
				}
				let endLoc = this.codeBlock.codeJmp(0);
				this.codeBlock.setLoc(skipLoc);
				this.codeBlock.codePush(expr.operator === TOK_AND ? 0 : 1);
				this.codeBlock.setLoc(endLoc);
				return EVAL_TYPE_BOOLEAN;
			}
			if (expr.operator === TOK_TIMES) {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				let rightType = this.eval(expr.right);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(right, "integer").fromExpr(expr.right);
				}
				this.codeBlock.codePush(leftType.slotCount());
				this.codeBlock.codeExt(PLW_LOPCODE_CREATE_BLOB_REPEAT_ITEM);
				return this.addType(new EvalTypeArray(leftType));
			}
			if (expr.operator === TOK_REM) {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				if (leftType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(leftType, "integer").fromExpr(expr.left);
				}
				let rightType = this.eval(expr.right);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType !== EVAL_TYPE_INTEGER) {
					return EvalError.wrongType(rightType, "integer").fromExpr(expr.right);
				}
				this.codeBlock.codeRem();
				return EVAL_TYPE_INTEGER;
			}
			if (
				expr.operator === TOK_ADD || expr.operator === TOK_SUB ||
				expr.operator === TOK_DIV || expr.operator === TOK_MUL ||
				expr.operator === TOK_GT || expr.operator === TOK_LT ||
				expr.operator === TOK_GTE || expr.operator === TOK_LTE
			) {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				if (leftType !== EVAL_TYPE_INTEGER && leftType !== EVAL_TYPE_REAL) {
					return EvalError.wrongType(leftType, "integer or real").fromExpr(expr.left);
				}
				let rightType = this.eval(expr.right);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType !== leftType) {
					return EvalError.wrongType(rightType, leftType.typeKey()).fromExpr(expr.right);
				}
				if (leftType === EVAL_TYPE_INTEGER) {
					if (expr.operator === TOK_ADD) {
						this.codeBlock.codeAdd();
					} else if (expr.operator === TOK_SUB) {
						this.codeBlock.codeSub();
					} else if (expr.operator === TOK_DIV) {
						this.codeBlock.codeDiv();
					} else if (expr.operator === TOK_MUL) {
						this.codeBlock.codeMul();
					} else if (expr.operator === TOK_GT) {
						this.codeBlock.codeGt();
					} else if (expr.operator === TOK_LT) {
						this.codeBlock.codeLt();
					} else if (expr.operator === TOK_GTE) {
						this.codeBlock.codeGte();
					} else {
						this.codeBlock.codeLte();
					}
				} else {
					if (expr.operator === TOK_ADD) {
						this.codeBlock.codeAddf();
					} else if (expr.operator === TOK_SUB) {
						this.codeBlock.codeSubf();
					} else if (expr.operator === TOK_DIV) {
						this.codeBlock.codeDivf();
					} else if (expr.operator === TOK_MUL) {
						this.codeBlock.codeMulf();
					} else if (expr.operator === TOK_GT) {
						this.codeBlock.codeGtf();
					} else if (expr.operator === TOK_LT) {
						this.codeBlock.codeLtf();
					} else if (expr.operator === TOK_GTE) {
						this.codeBlock.codeGtef();
					} else {
						this.codeBlock.codeLtef();
					}
				}
				if (
					expr.operator === TOK_ADD || expr.operator === TOK_SUB ||
					expr.operator === TOK_DIV || expr.operator === TOK_MUL
				) {
					return leftType;
				}
				return EVAL_TYPE_BOOLEAN;
			}
			if (expr.operator === TOK_IN) {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				let rightType = this.eval(expr.right);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType.structuralType().tag !== "res-type-array") {
					return EvalError.wrongType(rightType, "array").fromExpr(expr.right);
				}
				if (leftType !== rightType.structuralType().underlyingType) {
					return EvalError.wrongType(leftType, rightType.structuralType().underlyingType.typeKey()).fromExpr(expr.left);
				}
				this.codeBlock.codePush(leftType.slotCount());
				this.codeBlock.codeExt(PLW_LOPCODE_GET_BLOB_INDEX_OF_ITEM);
				this.codeBlock.codePush(-1);
				this.codeBlock.codeEq(1);
				this.codeBlock.codeNot();				
				return EVAL_TYPE_BOOLEAN;
			}
			if (expr.operator === TOK_EQ || expr.operator === TOK_NE) {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				let rightType = this.eval(expr.right, leftType);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType !== leftType) {
					return EvalError.wrongType(rightType, leftType.typeKey()).fromExpr(expr.right);
				}
				this.codeBlock.codeEq(leftType.slotCount());				
				if (expr.operator === TOK_NE) {
					this.codeBlock.codeNot();
				}
				return EVAL_TYPE_BOOLEAN;
			}
			return EvalError.unknownBinaryOperator(expr.operator).fromExpr(expr);
		}
		if (expr.tag === "ast-operator-unary") {
			let operandType = this.eval(expr.operand);
			if (operandType.isError()) {
				return operandType;
			}
			if (expr.operator === TOK_NOT) {
				if (operandType !== EVAL_TYPE_BOOLEAN) {
					return EvalError.wrongType(operandType, "boolean").fromExpr(expr.operand);
				}
				this.codeBlock.codeNot();
				return EVAL_TYPE_BOOLEAN;
			}
			if (expr.operator === TOK_SUB) {
				if (operandType !== EVAL_TYPE_INTEGER && operandType !== EVAL_TYPE_REAL) {
					return EvalError.wrongType(operandType, "integer or real").fromExpr(expr.operand);
				}
				if (operandType === EVAL_TYPE_INTEGER) {
					this.codeBlock.codeNeg();
				} else {
					this.codeBlock.codeNegf();
				}
				return operandType;
			}
			return EvalError.unknownUnaryOperator(expr.operator).fromExpr(expr);
		}
		if (expr.tag === "ast-variable") {
			let v = this.scope.getVariable(expr.varName);
			if (v === null) {
				return EvalError.unknownVariable(expr.varName).fromExpr(expr);
			}
			for (let i = 0; i < v.varType.slotCount(); i++) {
				if (v.isGlobal) {
					this.codeBlock.codePushGlobal(v.offset + i);
				} else {
					this.codeBlock.codePushLocal(v.offset + i);
				}
			}
			if (v.stat !== null) {
				v.stat.addReadLoc(this.codeBlock.currentLoc() - 1, expr);
			}
			return v.varType;
		}
		if (expr.tag === "ast-index") {
			// evaluate the array ref
			let indexedType = this.eval(expr.indexed);
			if (indexedType.isError()) {
				return indexedType;
			}
			let structType = indexedType.structuralType();
			if (structType.tag !== "res-type-array") {
				return EvalError.wrongType(indexedType, "array").fromExpr(expr.indexed);
			}
			let itemType = structType.underlyingType;
			// evaluate the index
			let indexType = this.eval(expr.index);
			if (indexType.isError()) {
				return indexType;
			}
			if (indexType !== EVAL_TYPE_INTEGER) {
				return EvalError.wrongType(indexType, "integer").fromExpr(expr.index);
			}
			if (itemType.slotCount() > 1) {
				this.codeBlock.codePush(itemType.slotCount());
				this.codeBlock.codeMul();
			}
			if (expr.indexTo === null) {
				this.codeBlock.codePush(itemType.slotCount());
				this.codeBlock.codeExt(PLW_LOPCODE_READ_BLOB);
				return indexedType.underlyingType;	
			}
			// indexTo is not null, we have a range index
			let indexToType = this.eval(expr.indexTo);
			if (indexToType.isError()) {
				return indexToType;
			}
			if (indexToType !== EVAL_TYPE_INTEGER) {
				return EvalError.wrongType(indexToType, "integer").fromExpr(expr.indexTo);
			}
			this.codeBlock.codePush(1);
			this.codeBlock.codeAdd();
			if (itemType.slotCount() > 1) {
				this.codeBlock.codePush(itemType.slotCount());
				this.codeBlock.codeMul();
			}
			this.codeBlock.codeExt(PLW_LOPCODE_SLICE_BLOB);
			return indexedType;
		}		
		if (expr.tag === "ast-field") {
			let recordType = this.eval(expr.expr);
			if (recordType.isError()) {
				return recordType;
			}
			let structType = recordType.structuralType();
			if (structType.tag != "res-type-record") {
				return EvalError.wrongType(recordType, "record").fromExpr(expr.expr);
			}
			let field = structType.getField(expr.fieldName);
			if (field === null) {
				return EvalError.unknownField(expr.fieldName, recordType.typeKey()).fromExpr(expr);
			}
			this.codeBlock.codePush(field.offset);
			this.codeBlock.codePush(field.fieldType.slotCount());
			this.codeBlock.codeExt(PLW_LOPCODE_READ_BLOB);
			return field.fieldType;
		}
		if (expr.tag === "ast-function") {
			let argTypes = [];
			for (let i = 0; i < expr.argList.argCount; i++) {
				let argType = this.eval(expr.argList.args[i]);
				if (argType.isError()) {
					return argType;
				}
				argTypes[i] = argType;
			}
			let resultType = this.generateFunctionCall(expr.functionName, expr.argList.argCount, argTypes, expectedType);
			if (resultType.isError()) {
				return resultType.fromExpr(expr);
			}
			return resultType;
		}
		if (expr.tag === "ast-case") {
			let caseType = null;
			if (expr.caseExpr !== null) {
				caseType = this.eval(expr.caseExpr);
				if (caseType.isError()) {
					return caseType;
				}
			}
			let endLocs = [];
			let endLocCount = 0;
			let resultType = null;
			for (let i = 0; i < expr.whenCount; i++) {
				if (caseType !== null) {
					this.codeBlock.codeDup(caseType.slotCount());
					let whenType = this.eval(expr.whens[i].whenExpr);
					if (whenType.isError()) {
						return whenType;
					}
					if (whenType !== caseType) {
						return EvalError.wrongType(whenType, caseType.typeKey()).fromExpr(expr.whens[i].whenExpr);
					}
					this.codeBlock.codeEq(caseType.slotCount());
					let nextLoc = this.codeBlock.codeJz(0);
					this.codeBlock.codePopVoid(caseType.slotCount());
					let thenType = this.eval(expr.whens[i].thenExpr);
					if (thenType.isError()) {
						return thenType;
					}
					if (resultType === null) {
						resultType = thenType;
					} else if (thenType !== resultType) {
						return EvalError.wrongType(thenType, resultType.typeKey()).fromExpr(expr.whens[i].whenExpr);
					}
					endLocs[endLocCount] = this.codeBlock.codeJmp(0);
					endLocCount++;
					this.codeBlock.setLoc(nextLoc);
				} else {
					let whenType = this.eval(expr.whens[i].whenExpr);
					if (whenType.isError()) {
						return whenType;
					}
					if (whenType !== EVAL_TYPE_BOOLEAN) {
						return EvalError.wrongType(whenType, "boolean").fromExpr(expr.whens[i].whenExpr);
					}
					let nextLoc = this.codeBlock.codeJz(0);
					let thenType = this.eval(expr.whens[i].thenExpr);
					if (thenType.isError()) {
						return thenType;
					}
					if (resultType === null) {
						resultType = thenType;
					} else if (thenType !== resultType) {
						return EvalError.wrongType(thenType, resultType.typeKey()).fromExpr(expr.whens[i].whenExpr);
					}
					endLocs[endLocCount] = this.codeBlock.codeJmp(0);
					endLocCount++;
					this.codeBlock.setLoc(nextLoc);
				}		
			}
			if (caseType !== null) {
				this.codeBlock.codePopVoid(caseType.slotCount());
			}
			let elseType = this.eval(expr.elseExpr);
			if (elseType.isError()) {
				return elseType;
			}
			if (resultType === null) {
				resultType = elseType;
			} else if (elseType !== resultType) {
				return EvalError.wrongType(elseType, resultType.typeKey()).fromExpr(expr.elseExpr);
			}
			for (let i = 0; i < endLocCount; i++) {
				this.codeBlock.setLoc(endLocs[i]);
			}
			return resultType;
		}
		if (expr.tag === "ast-kindof") {
			let caseType = this.eval(expr.caseExpr);
			if (caseType.isError()) {
				return caseType;
			}
			if (caseType.structuralType().tag !== "res-type-variant") {
				return EvalError.wrongType(caseType, "variant").fromExpr(expr.caseExpr);
			}
			let endLocs = [];
			let endLocCount = 0;
			let resultType = null;
			let kindHasWhen = [];
			for (let i = 0; i < caseType.structuralType().typeCount; i++) {
				kindHasWhen[i] = false;
			}
			for (let i = 0; i < expr.whenCount; i++) {
				// Duplicate the last slot of the variant which is the variantType
				this.codeBlock.codeDup(1);
				let whenType = this.evalType(expr.whens[i].type);
				if (whenType.isError()) {
					return whenType;
				}
				let typeIndex = caseType.structuralType().types.indexOf(whenType);
				if (typeIndex === -1) {
					return EvalError.unknownVariantKind(whenType.typeKey()).fromExpr(expr.whens[i]);
				}
				if (kindHasWhen[typeIndex] === true) {
					return EvalError.variantKindAlreadyManaged(whenType.typeKey()).fromExpr(expr.whens[i]);
				}
				kindHasWhen[typeIndex] = true;
				// Duplicate the last slot of the variant which is the variantType
				this.codeBlock.codePush(whenType.globalId);
				this.codeBlock.codeEq(1);
				// If false, loop
				let nextLoc = this.codeBlock.codeJz(0);
				// If true, resize the variant type to the actual type size
				this.codeBlock.codePopVoid(caseType.slotCount() - whenType.slotCount());
				this.pushScopeBlock();
				this.scope.addVariable(expr.whens[i].varName, whenType, true);
				let thenType = this.eval(expr.whens[i].thenExpr);
				if (thenType.isError()) {
					return thenType;
				}
				if (resultType === null) {
					resultType = thenType;
				} else if (thenType !== resultType) {
					return EvalError.wrongType(thenType, resultType.typeKey()).fromExpr(expr.whens[i].whenExpr);
				}
				// Replace the when var with the then value, and pop the when var
				this.codeBlock.codeSwap(whenType.slotCount() + thenType.slotCount());
				this.codeBlock.codePopVoid(whenType.slotCount());
				if (thenType.slotCount() > 1) {
					this.codeBlock.codeSwap(thenType.slotCount());
				}
				this.popScope();
				// We are done, goto end
				endLocs[endLocCount] = this.codeBlock.codeJmp(0);
				endLocCount++;
				this.codeBlock.setLoc(nextLoc);
			}
			// No match, we still have the case var on the stack, we pop it
			this.codeBlock.codePopVoid(caseType.slotCount());
			// If there is no else expression, we check that all the kind where managed
			// Otherwise we evaluate the else expression
			if (expr.elseExpr === null) {
				for (let i = 0; i < caseType.structuralType().typeCount; i++) {
					if (kindHasWhen[i] === false) {
						return EvalError.variantKindNotManaged(caseType.structuralType().types[i].typeKey()).fromExpr(expr);
					}
				}
			} else {
				let elseType = this.eval(expr.elseExpr);
				if (elseType.isError()) {
					return elseType;
				}
				if (resultType === null) {
					resultType = elseType;
				} else if (elseType !== resultType) {
					return EvalError.wrongType(elseType, resultType.typeKey()).fromExpr(expr.elseExpr);
				}
			}
			for (let i = 0; i < endLocCount; i++) {
				this.codeBlock.setLoc(endLocs[i]);
			}
			return resultType;
		}
		return EvalError.unknownType(expr.tag).fromExpr(expr);
	}
	
	evalParameter(expr) {
		if (expr.tag !== "ast-parameter") {
			return EvalError.unknownType(expr.tag).fromExpr(expr);
		}
		let paramType = this.evalType(expr.parameterType);
		if (paramType.isError()) {
			return paramType;
		}
		return new EvalResultParameter(expr.parameterName, paramType);
	}
	
	evalParameterList(expr) {
		if (expr.tag !== "ast-parameter-list") {
			return EvalError.unknownType(expr.tag).fromExpr(expr);
		}
		let parameters = [];
		for (let i = 0; i < expr.parameterCount; i++) {
			let parameter = this.evalParameter(expr.parameters[i]);
			if (parameter.isError()) {
				return parameter;
			}
			for (let k = 0; k < i; k++) {
				if (parameters[k].parameterName === parameter.parameterName) {
					return EvalError.parameterAlreadyExists(parameter.parameterName).fromExpr(expr.parameters[i]);
				}
			}
			parameters[i] = parameter;
		}
		return new EvalResultParameterList(expr.parameterCount, parameters);
	}

}

"use strict";
/******************************************************************************************************************************************

	RefManager
	
	Manage chunks of memory with reference counting
	
	TODO:
	
	The RefManager should manage all resource that must be closed
	
		* pointer to allocated heap memory
		* file
		* sockets

******************************************************************************************************************************************/

const PLW_TAG_REF_EXCEPTION_HANDLER = 1;
const PLW_TAG_REF_STRING = 2;
const PLW_TAG_REF_BLOB = 3;

const PLW_TAG_REF_NAMES = [
	"",
	"EXCEPTION_HANDLER",
	"STRING",
	"BLOB"
];

class PlwRefManagerError {
	
	constructor() {
		this.refId = -1;
		this.refTag = -1;
		this.offset = -1;
		this.errorMsg = null;
	}
	
	invalidRefId(refId) {
		this.refId = refId;
		this.errorMsg = "invalid refId";
	}
	
	invalidRefType(refId) {
		this.refId = refId;
		this.errorMsg = "invalid ref type";
	}
	
	invalidRefTag(refTag) {
		this.refTag = refTag;
		this.errorMsg = "invalid ref tag";
	}
	
	invalidOffset(offset) {
		this.offset = offset;
		this.errorMsg = "invalid ref offset";
	}
	
	hasError() {
		return this.errorMsg !== null;
	}
}

class PlwAbstractRef {

	constructor(tag) {
		this.tag = tag;
		this.refCount = 1;
	}
	
	getTag() {
		return this.tag;
	}
		
	shallowCopy(refMan, refManError) {
		refManError.invalidRefTag(this.tag);
		return -1;
	}
	
	compareTo(refMan, ref, refManError) {
		refManError.invalidRefTag(this.tag);
		return false;
	}
	
	destroy(refMan, refManError) {
		refManError.invalidRefTag(this.tag);
	}
}

class PlwExceptionHandlerRef extends PlwAbstractRef {

	constructor(codeBlockId, ip, bp) {
		super(PLW_TAG_REF_EXCEPTION_HANDLER);
		this.codeBlockId = codeBlockId;
		this.ip = ip;
		this.bp = bp;
	}
	
	static make(refMan, codeBlockId, ip, bp) {
		return refMan.addRef(new PlwExceptionHandlerRef(codeBlockId, ip, bp));
	}			
	
	destroy(refMan, refManError) {
	}

}


class PlwStringRef extends PlwAbstractRef {
	constructor(str) {
		super(PLW_TAG_REF_STRING);
		this.str = str;
	}
	
	static make(refMan, str) {
		return refMan.addRef(new PlwStringRef(str));
	}
	
	compareTo(refMan, ref, refManError) {
		return this.str === ref.str;
	}
	
	destroy(refMan, refManError) {
		this.str = null;
	}
}


class PlwBlobRef extends PlwAbstractRef {

	constructor(blobSize, ptr, mapPtr) {
		super(PLW_TAG_REF_BLOB);
		this.blobSize = blobSize;
		this.ptr = ptr;
		this.mapPtr = mapPtr;
	}
	
	static make(refMan, blobSize, ptr, mapPtr) {
		return refMan.addRef(new PlwBlobRef(blobSize, ptr, mapPtr));
	}
	
	resize(newSize) {
		for (let i = this.blobSize; i < newSize; i++) {
			this.ptr[i] = 0;
			this.mapPtr[i] = false;
		}
		this.blobSize = newSize;
	}
	
	shallowCopy(refMan, refManError) {
		let newPtr = [...this.ptr];
		let newMapPtr = [...this.mapPtr];
		for (let i = 0; i < this.blobSize; i++) {
			if (this.mapPtr[i]) {
				refMan.incRefCount(newPtr[i], refManError);
				if (refManError.hasError()) {
					return -1;
				}
			}
		}
		return PlwBlobRef.make(refMan, this.blobSize, newPtr, newMapPtr);
	}
	
	compareTo(refMan, ref, refManError) {
		if (this.blobSize !== ref.blobSize) {
			return false;
		}
		for (let i = 0; i < this.blobSize; i++) {
			if (this.mapPtr[i] !== ref.mapPtr[i]) {
				return false;
			}
		}
		for (let i = 0; i < this.blobSize; i++) {
			if (this.mapPtr[i]) {
				if (!refMan.compareRefs(this.ptr[i], ref.ptr[i], refManError)) {
					return false;
				}
				if (refManError.hasError()) {
					return false;
				}
			} else {
				if (this.ptr[i] !== ref.ptr[i]) {
					return false;
				}
			}
		}
		return true;
	}

	destroy(refMan, refManError) {
		for (let i = 0; i < this.blobSize; i++) {
			if (this.mapPtr[i]) {
				refMan.decRefCount(this.ptr[i], refManError);
				if (refManError.hasError()) {
					return;
				}
			}
		}
		this.ptr = null
		this.mapPtr = null;
	}

}



class PlwRefManager {

	constructor() {
		this.refs = new Array(1000).fill(null);
		this.refCount = 0;
		this.freeRefIds = new Array(1000).fill(-1);
		this.freeRefIdCount = 0;
	}
	
	isValidRefId(refId) {
		return refId >= 0 && refId < this.refCount && this.refs[refId] !== null;
	}
	
	getRef(refId, refManError) {
		if (this.isValidRefId(refId) === false) {
			refManError.invalidRefId(refId);
			return null;	
		}
		return this.refs[refId];
	}
	
	getRefOfType(refId, refType, refManError) {
		let ref = this.getRef(refId, refManError);
		if (refManError.hasError()) {
			return null;
		}
		if (ref.tag !== refType) {
			refManError.invalidRefType(refId);
			return null;
		}
		return ref;
	}
	
	createRefId() {
		let refId = -1;
		if (this.freeRefIdCount > 0) {
			refId = this.freeRefIds[this.freeRefIdCount - 1];
			this.freeRefIdCount--;
		} else {
			refId = this.refCount;
			this.refCount++;
		}
		return refId;
	}
	
	addRef(ref) {
		let refId = this.createRefId();
		this.refs[refId] = ref;
		return refId;
	}
							
	incRefCount(refId, refManError) {
		if (this.isValidRefId(refId) === false) {
			refManError.invalidRefId(refId);
			return;	
		}
		this.refs[refId].refCount++;
	}
	
	addRefCount(refId, count, refManError) {
		if (this.isValidRefId(refId) === false) {
			refManError.invalidRefId(refId);
			return;	
		}
		this.refs[refId].refCount += count;
	}
	
	decRefCount(refId, refManError) {
		if (this.isValidRefId(refId) === false) {
			refManError.invalidRefId(refId);
			return;	
		}
		let ref = this.refs[refId];
		ref.refCount--;
		if (ref.refCount === 0) {
			ref.destroy(this, refManError);
			if (refManError.hasError()) {
				return;
			}
			this.refs[refId] = null;
			this.freeRefIds[this.freeRefIdCount] = refId;
			this.freeRefIdCount++;
		}
	}
	
	compareRefs(refId1, refId2, refManError) {
		if (this.isValidRefId(refId1) === false) {
			refManError.invalidRefId(refId1);
			return false;
		}
		if (!this.isValidRefId(refId2)) {
			refManError.invalidRefId(refId2);
			return false;
		}
		if (refId1 === refId2) {
			return true;
		}
		let ref1 = this.refs[refId1];
		let ref2 = this.refs[refId2];
		if (ref1.tag !== ref2.tag) {
			return false;
		}
		return ref1.compareTo(this, ref2, refManError);
	}
		
	makeMutable(refId, refManError) {
		if (this.isValidRefId(refId) === false) {
			refManError.invalidRefId(refId);
			return -1;
		}
		let ref = this.refs[refId];
		if (ref.refCount === 1) {
			return refId;
		}
		let newRefId = ref.shallowCopy(this, refManError);
		if (refManError.hasError()) {
			return -1;
		}
		ref.refCount--;
		return newRefId;
	}
			
}

"use strict";
/******************************************************************************************************************************************

	StackMachine
	
	Execute pcode
	
	The SM should not not read or write to memory it doesn't own, even if feed with bogus code.
	There is no guarantee to not leak memory if code is bogus 
	
	
	Stack Frame:
		arg1				<- BP - 4 - argCount 
		...
		argN				<- BP - 5
		argCount			<- BP - 4
		retCodeBlockId		<- BP - 3
		retIP				<- BP - 2
		oldBP				<- BP - 1
		local1				<- BP
		
******************************************************************************************************************************************/



class StackMachineError {

	constructor(errorMsg) {
		this.currentBlockId = -1;
		this.ip = 0;
		this.errorMsg = errorMsg;
		this.refManError = null;
	}
	
	fromCode(currentBlockId, ip) {
		this.currentBlockId = currentBlockId;
		this.ip = ip;
		return this;
	}
	
	static trap(trapName) {
		return new StackMachineError(trapName);
	}
	
	static suspended() {
		return new StackMachineError("suspended");
	}
		
	static stackAccessOutOfBound() {
		return new StackMachineError("stack access out of bound");
	}
	
	static codeAccessOutOfBound() {
		return new StackMachineError("code access out of bound");
	}
	
	static constAccessOutOfBound() {
		return new StackMachineError("const access out of bound");
	}
	
	static invalidRefType() {
		return new StackMachineError("invalid ref type");
	}
	
	static refAccessOutOfBound() {
		return new StackMachineError("ref access out of bound");
	}
	
	static invalidSize() {
		return new StackMachineError("invalid size");
	}
	
	static divByZero() {
		return new StackMachineError("div by zero");
	}
	
	static referenceManagerError(refManError) {
		let error = new StackMachineError("refman error");
		error.refManError = refManError;
		return error;
	}
	
	static unknownOp() {
		return new StackMachineError("unknown op");
	}
	
	static nativeArgCountMismatch() {
		return new StackMachineError("wrong number of arguments provided to a native call");
	}
	
	static exception(errorCode) {
		return new StackMachineError("Uncaught exception " + errorCode);
	}
}

let PLW_NOARG_OPS = [];

PLW_NOARG_OPS[PLW_OPCODE_SUSPEND] = function(sm) {
	return StackMachineError.suspended().fromCode(sm.codeBlockId, sm.ip);
}

PLW_NOARG_OPS[PLW_OPCODE_DIV] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let divisor = sm.stack[sm.sp - 1];
	if (divisor === 0) {
		return StackMachineError.divByZero().fromCode(sm.codeBlockId, sm.ip);
	} else {
		sm.stack[sm.sp - 2] = Math.trunc(sm.stack[sm.sp - 2] / divisor);
		sm.sp--;
	}
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_DIVF] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let divisor = sm.stack[sm.sp - 1];
	if (divisor === 0) {
		return StackMachineError.divByZero().fromCode(sm.codeBlockId, sm.ip);
	} else {
		sm.stack[sm.sp - 2] = sm.stack[sm.sp - 2] / divisor;
		sm.sp--;
	}
	return null;
};
	
PLW_NOARG_OPS[PLW_OPCODE_REM] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let divisor = sm.stack[sm.sp - 1];
	if (divisor === 0) {
		return StackMachineError.divByZero().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = sm.stack[sm.sp - 2] % divisor;
	sm.sp--;
	return null;
};
	
PLW_NOARG_OPS[PLW_OPCODE_ADD] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] += sm.stack[sm.sp - 1];
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_ADDF] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] += sm.stack[sm.sp - 1];
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_SUB] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] -= sm.stack[sm.sp - 1];
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_SUBF] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] -= sm.stack[sm.sp - 1];
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_MUL] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] *= sm.stack[sm.sp - 1];
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_MULF] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] *= sm.stack[sm.sp - 1];
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_NEG] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 1] = -sm.stack[sm.sp - 1]; 
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_NEGF] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 1] = -sm.stack[sm.sp - 1]; 
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_GT] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = (sm.stack[sm.sp - 2] > sm.stack[sm.sp - 1]) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_GTF] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = (sm.stack[sm.sp - 2] > sm.stack[sm.sp - 1]) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_LT] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = (sm.stack[sm.sp - 2] < sm.stack[sm.sp - 1]) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_LTF] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = (sm.stack[sm.sp - 2] < sm.stack[sm.sp - 1]) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_GTE] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = (sm.stack[sm.sp - 2] >= sm.stack[sm.sp - 1]) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_GTEF] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = (sm.stack[sm.sp - 2] >= sm.stack[sm.sp - 1]) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_LTE] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = (sm.stack[sm.sp - 2] <= sm.stack[sm.sp - 1]) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_LTEF] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = (sm.stack[sm.sp - 2] <= sm.stack[sm.sp - 1]) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_AND] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = ((sm.stack[sm.sp - 2] !== 0) && (sm.stack[sm.sp - 1] !== 0)) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_OR] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 2] = ((sm.stack[sm.sp - 2] !== 0) || (sm.stack[sm.sp - 1] !== 0)) ? 1 : 0;
	sm.sp--;
	return null;
};

PLW_NOARG_OPS[PLW_OPCODE_NOT] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp - 1] = sm.stack[sm.sp - 1] === 0 ? 1 : 0;
	return null;
};


let PLW_OPS = [];

PLW_OPS[PLW_OPCODE_NOARG] = function(sm, code) {
	return PLW_NOARG_OPS[code](sm);
};

PLW_OPS[PLW_OPCODE_POP_VOID] = function(sm, cellCount) {
	if (cellCount < 0 || cellCount > sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	for (let i = sm.sp - 1; i >= sm.sp - cellCount; i--) {
		if (sm.stackMap[i] === true) {
			sm.refMan.decRefCount(sm.stack[i], sm.refManError);
			if (sm.refManError.hasError()) {
				return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
			}
		}
	}
	sm.sp -= cellCount;
	return null;
};
	
PLW_OPS[PLW_OPCODE_CALL_NATIVE] = function(sm, nativeId) {
	if (nativeId < 0 || nativeId >= sm.natives.length) {
		return StackMachineError.codeAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let argCount = sm.stack[sm.sp - 1];
	if (sm.sp < 1 + argCount) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let error = sm.natives[nativeId](sm);
	if (error !== null) {
		if (error.errorMsg.charAt(0) === "@") {
			return error;
		}
		console.log("error from native function " + nativeId);
		return error.fromCode(sm.codeBlockId, sm.ip);
	}
	return null;
};
	
PLW_OPS[PLW_OPCODE_EXT] = function(sm, extOpcode) {
	if (extOpcode < 0 || extOpcode >= sm.extops.length) {
		return StackMachineError.codeAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let error = sm.extops[extOpcode](sm);
	if (error !== null) {
		return error.fromCode(sm.codeBlockId, sm.ip);
	}
	return null;
};
	
PLW_OPS[PLW_OPCODE_PUSH_GLOBAL] = function(sm, offset) {
	if (offset < 0 || offset >= sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp] = sm.stack[offset];
	sm.stackMap[sm.sp] = sm.stackMap[offset];
	if (sm.stackMap[sm.sp] === true) {
		sm.refMan.incRefCount(sm.stack[sm.sp], sm.refManError);
		if (sm.refManError.hasError()) {
			return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
		}
	}
	sm.sp++;
	return null;
};
	
PLW_OPS[PLW_OPCODE_PUSH_GLOBAL_MOVE] = function(sm, offset) {
	if (offset < 0 || offset >= sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp] = sm.stack[offset];
	sm.stackMap[sm.sp] = sm.stackMap[offset];
	sm.stack[offset] = -1;
	sm.stackMap[offset] = false;
	sm.sp++;
	return null;
};
	
PLW_OPS[PLW_OPCODE_PUSH_GLOBAL_FOR_MUTATE] = function(sm, offset) {
	if (offset < 0 || offset >= sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[offset] = sm.refMan.makeMutable(sm.stack[offset], sm.refManError);
	if (sm.refManError.hasError()) {
		return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stackMap[offset] = true;
	sm.stack[sm.sp] = sm.stack[offset];
	sm.stackMap[sm.sp] = sm.stackMap[offset];
	if (sm.stackMap[sm.sp] === true) {
		sm.refMan.incRefCount(sm.stack[sm.sp], sm.refManError);
		if (sm.refManError.hasError()) {
			return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
		}
	}
	sm.sp++;
	return null;
};
	
PLW_OPS[PLW_OPCODE_PUSH_LOCAL] = function(sm, offset) {
	if (sm.bp + offset < 0 || sm.bp + offset >= sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp] = sm.stack[sm.bp + offset];
	sm.stackMap[sm.sp] = sm.stackMap[sm.bp + offset];
	if (sm.stackMap[sm.sp] === true) {
		sm.refMan.incRefCount(sm.stack[sm.sp], sm.refManError);
		if (sm.refManError.hasError()) {
			return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
		}
	}
	sm.sp++;
	return null;
};
	
PLW_OPS[PLW_OPCODE_PUSH_LOCAL_MOVE] = function(sm, offset) {
	if (sm.bp + offset < 0 || sm.bp + offset >= sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp] = sm.stack[sm.bp + offset];
	sm.stackMap[sm.sp] = sm.stackMap[sm.bp + offset];
	sm.stack[sm.bp + offset] = -1;
	sm.stackMap[sm.bp + offset] = false;
	sm.sp++;
	return null;
};
	
PLW_OPS[PLW_OPCODE_PUSH_LOCAL_FOR_MUTATE] = function(sm, offset) {
	if (sm.bp + offset < 0 || sm.bp + offset >= sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.bp + offset] = sm.refMan.makeMutable(sm.stack[sm.bp + offset], sm.refManError);
	if (sm.refManError.hasError()) {
		return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stackMap[sm.bp + offset] = true;
	sm.stack[sm.sp] = sm.stack[sm.bp + offset];
	sm.stackMap[sm.sp] = sm.stackMap[sm.bp + offset];
	if (sm.stackMap[sm.sp] === true) {
		sm.refMan.incRefCount(sm.stack[sm.sp], sm.refManError);
		if (sm.refManError.hasError()) {
			return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
		}
	}
	sm.sp++;
	return null;
};
	
PLW_OPS[PLW_OPCODE_POP_GLOBAL] = function(sm, offset) {
	if (sm.sp < 1 || offset < 0 || offset >= sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	if (sm.stackMap[offset] === true) {
		sm.refMan.decRefCount(sm.stack[offset], sm.refManError);
		if (sm.refManError.hasError()) {
			return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
		}						
	}
	sm.stack[offset] = sm.stack[sm.sp - 1];
	sm.stackMap[offset] = sm.stackMap[sm.sp - 1];
	sm.sp--;
	return null;
};
	
PLW_OPS[PLW_OPCODE_POP_LOCAL] = function(sm, offset) {
	if (sm.sp < 1 || sm.bp + offset < 0 || sm.bp + offset >= sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	if (sm.stackMap[sm.bp + offset] === true) {
		sm.refMan.decRefCount(sm.stack[sm.bp + offset], sm.refManError);
		if (sm.refManError.hasError()) {
			return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
		}
	}
	sm.stack[sm.bp + offset] = sm.stack[sm.sp - 1];
	sm.stackMap[sm.bp + offset] = sm.stackMap[sm.sp - 1];
	sm.sp--;
	return null;
};
	
PLW_OPS[PLW_OPCODE_JZ] = function(sm, arg1) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	if (sm.stack[sm.sp - 1] === 0) {
		sm.ip = arg1;
	}
	sm.sp--;
	return null;
};

PLW_OPS[PLW_OPCODE_JNZ] = function(sm, arg1) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	if (sm.stack[sm.sp - 1] !== 0) {
		sm.ip = arg1;
	}
	sm.sp--;
	return null;
};

PLW_OPS[PLW_OPCODE_JMP] = function(sm, arg1) {
	sm.ip = arg1;
	return null;
};
	
PLW_OPS[PLW_OPCODE_PUSH] = function(sm, arg1) {
	sm.stack[sm.sp] = arg1;
	sm.stackMap[sm.sp] = false;
	sm.sp++;
	return null;
};

PLW_OPS[PLW_OPCODE_CALL] = function(sm, arg1) {
	if (arg1 < 0 || arg1 > sm.codeBlocks.length) {
		return StackMachineError.codeAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp] = sm.codeBlockId;
	sm.stackMap[sm.sp] = false;
	sm.sp++;
	sm.stack[sm.sp] = sm.ip;
	sm.stackMap[sm.sp] = false;
	sm.sp++;					
	sm.stack[sm.sp] = sm.bp;
	sm.stackMap[sm.sp] = false;
	sm.sp++;
	sm.bp = sm.sp;
	sm.codeBlockId = arg1;
	sm.ip = 0;
	return null;
};

PLW_OPS[PLW_OPCODE_PUSHF] = function(sm, floatId) {
	if (floatId < 0 || floatId >= sm.codeBlocks[sm.codeBlockId].floatConsts.length) {
		return StackMachineError.constAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);						
	}
	sm.stack[sm.sp] = sm.codeBlocks[sm.codeBlockId].floatConsts[floatId];
	sm.stackMap[sm.sp] = false;
	sm.sp++;
	return null;
};
	
PLW_OPS[PLW_OPCODE_EQ] = function(sm, count) {
	if (count < 1 || sm.sp < count * 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let idx1 = sm.sp - 2 * count;
	let idx2 = sm.sp - count;
	let result = true;
	for (let i = 0; i < count; i++) {
		if (result === true) {
			if (sm.stackMap[idx1]) {
				result = sm.refMan.compareRefs(sm.stack[idx1], sm.stack[idx2], sm.refManError);
				if (sm.refManError.hasError()) {
					return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
				}
				if (sm.refManError.hasError()) {
					return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
				}
			} else {
				result = sm.stack[idx1] === sm.stack[idx2];
			}
		}
		if (sm.stackMap[idx1]) {
			sm.refMan.decRefCount(sm.stack[idx1], sm.refManError);
			if (sm.refManError.hasError()) {
				return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
			}
		}
		if (sm.stackMap[idx2]) {
			sm.refMan.decRefCount(sm.stack[idx2], sm.refManError);
			if (sm.refManError.hasError()) {
				return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
			}
		}
		idx1++;
		idx2++;
	}
	sm.stack[sm.sp - 2 * count] = result ? 1 : 0;
	sm.stackMap[sm.sp - 2 * count] = false;
	sm.sp -= 2 * count - 1;
	return null;
};
	
PLW_OPS[PLW_OPCODE_RET] = function(sm, count) {
	if (count < 0 || sm.bp < 4 || sm.bp > sm.sp) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let previousBp = sm.stack[sm.bp - 1];
	let previousIp = sm.stack[sm.bp - 2];
	let previousCodeBlockId = sm.stack[sm.bp - 3];
	let argCount = sm.stack[sm.bp - 4];
	if (sm.bp < 4 + argCount) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	for (let i = sm.sp - count - 1; i >= sm.bp - 4 - argCount; i--) {
		if (sm.stackMap[i] === true) {
			sm.refMan.decRefCount(sm.stack[i], sm.refManError);
			if (sm.refManError.hasError()) {
				return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
			}
		}
	}
	for (let i = 0; i < count; i++) {
		sm.stack[sm.bp - 4 - argCount + i] = sm.stack[sm.sp - count + i];
		sm.stackMap[sm.bp - 4 - argCount + i] = sm.stackMap[sm.sp - count + i];
	}
	sm.sp = sm.bp - 4 - argCount + count;
	sm.bp = previousBp;
	sm.codeBlockId = previousCodeBlockId;
	sm.ip = previousIp;
	return null;
};
	
PLW_OPS[PLW_OPCODE_DUP] = function(sm, count) {
	if (count < 1 || sm.sp < count) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	for (let i = 0; i < count; i++) {
		sm.stack[sm.sp] = sm.stack[sm.sp - count];
		sm.stackMap[sm.sp] = sm.stackMap[sm.sp - count];
		if (sm.stackMap[sm.sp] === true) {
			sm.refMan.incRefCount(sm.stack[sm.sp], sm.refManError);
			if (sm.refManError.hasError()) {
				return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
			}
		}
		sm.sp++; 
	}
	return null;
};

PLW_OPS[PLW_OPCODE_SWAP] = function(sm, count) {
	if (count < 1 || sm.sp < count) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	for (let i = 0; i < count / 2; i++) {
		let tmp = sm.stack[sm.sp - count + i];
		let tmpMap = sm.stackMap[sm.sp - count + i];
		sm.stack[sm.sp - count + i] = sm.stack[sm.sp - 1 - i];
		sm.stackMap[sm.sp - count + i] = sm.stackMap[sm.sp - 1 - i];
		sm.stack[sm.sp - 1 - i] = tmp;
		sm.stackMap[sm.sp - 1 - i] = tmpMap;
	}
	return null;
};

class StackMachine {

	constructor() {
		this.stackMap = new Array(1000).fill(false);
		this.stack = new Array(1000).fill(0);
		this.sp = 0;
		this.bp = 0;
		this.ip = 0;
		this.codeBlockId = -1;
		this.codeBlocks = null;
		this.natives = null;
		this.extops = null;
		this.refMan = new PlwRefManager();
		this.refManError = new PlwRefManagerError();
	}
	
	hasRefManError() {
		return this.refManError.hasError();
	}
	
	errorFromRefMan() {
		return StackMachineError.referenceManagerError(this.refManError).fromCode(this.codeBlockId, this.ip);
	}
	
	popResult() {
		this.sp--;
		return this.stack[this.sp];
	}
		
	execute(codeBlock, codeBlocks, extops, natives) {
		this.codeBlocks = [...codeBlocks, codeBlock];
		this.extops = extops;
		this.natives = natives;
		this.ip = 0;
		this.codeBlockId = this.codeBlocks.length - 1;
		return this.runLoop();
	}

	runLoop() {
		let code = 0;
		let ret = null;
		let arg = 0;
		let codeBlock = null;
		for (;;) {
			codeBlock = this.codeBlocks[this.codeBlockId];
			if (this.ip >= codeBlock.codeSize - 1) {
				break;
			}
			code = codeBlock.codes[this.ip];
			this.ip++;
			arg = codeBlock.codes[this.ip];
			this.ip++;
			ret = PLW_OPS[code](this, arg);
			if (ret !== null) {
				return ret;
			}
		}
		return null;
	}
	
	dump(println) {
		println("cb: " + this.codeBlockId + ", ip: " + this.ip + ", bp: " + this.bp + ", sp: " + this.sp);
		if (this.codeBlockId !== -1) {
			let codeBlock = this.codeBlocks[this.codeBlockId];
			println("codeblock " + this.codeBlockId + ": " + codeBlock.blockName);
			for (let i = 0; i < codeBlock.codeSize - 1; i += 2) {
				let opcode = codeBlock.codes[i];
				let arg1 = codeBlock.codes[i + 1];
				let prefix = (i === this.ip ? "> " : "") + i + ": ";
				prefix = "          ".substring(0, 10 - prefix.length) + prefix;
				if (opcode === PLW_OPCODE_NOARG) {
					println(prefix + PLW_NOARG_OPCODES[arg1]);
				} else if (opcode === PLW_OPCODE_EXT) {
					println(prefix + PLW_LOPCODES[arg1]);
				} else {
					let opcodeName = PLW_OPCODES[opcode];
					println(prefix + opcodeName + "                              ".substring(0, 26 - opcodeName.length) + arg1);
				}
			}
		}
		println("stack:");
		for (let i = 0; i < this.sp; i++) {
			let prefix = "    ";
			if (this.bp === i) {
				prefix = " bp ";
			}
			println(prefix + i + ": " + (this.stackMap[i] === true ? "ref " : "    ") + this.stack[i]);
		}
		println("heap (total: " + this.refMan.refCount + ", free: " + this.refMan.freeRefIdCount + "):");
		for (let i = 0; i < this.refMan.refCount; i++) {
			let ref = this.refMan.refs[i];
			if (ref !== null) {
				println("    " + i + ": " + ref.refCount + " " + PLW_TAG_REF_NAMES[ref.tag] + " " + JSON.stringify(ref));
			}
		}
	}

}

"use strict";

let PLW_LOPS = [];

/* create_string(stringId integer)
 */
PLW_LOPS[PLW_LOPCODE_CREATE_STRING] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let strId = sm.stack[sm.sp - 1];
	if (strId < 0 || strId >= sm.codeBlocks[sm.codeBlockId].strConsts.length) {
		return StackMachineError.constAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);						
	}
	let str = sm.codeBlocks[sm.codeBlockId].strConsts[strId];
	sm.stack[sm.sp - 1] = PlwStringRef.make(sm.refMan, str);
	sm.stackMap[sm.sp - 1] = true;
	return null;
}


/* concat_string(items ...String, itemCount integer)
 */
PLW_LOPS[PLW_LOPCODE_CONCAT_STRING] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let itemCount = sm.stack[sm.sp - 1];
	if (itemCount < 0 || sm.sp < itemCount + 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let strs = new Array(itemCount);
	for (let i = 0; i < itemCount; i++) {
		let refId = sm.stack[sm.sp - itemCount - 1 + i];
		let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
		if (sm.hasRefManError()) {
			return sm.errorFromRefMan();
		}
		strs[i] = ref.str;
	}
	let resultRefId = PlwStringRef.make(sm.refMan, strs.join(""));
	for (let i = 0; i < itemCount; i++) {
		let refId = sm.stack[sm.sp - itemCount - 1 + i];
		sm.refMan.decRefCount(refId, sm.refManError);
		if (sm.hasRefManError()) {
			return sm.errorFromRefMan();
		}
	}
	sm.stack[sm.sp - itemCount - 1] = resultRefId;
	sm.stackMap[sm.sp - itemCount - 1] = true;
	sm.sp -= itemCount;
	return null;
}

/* create_blob(item ...integer, blobSize integer)
 */
PLW_LOPS[PLW_LOPCODE_CREATE_BLOB] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let blobSize = sm.stack[sm.sp - 1];
	if (blobSize < 0 || sm.sp < 1 + blobSize) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let ptr = sm.stack.slice(sm.sp - 1 - blobSize, sm.sp - 1);
	let mapPtr = sm.stackMap.slice(sm.sp - 1 - blobSize, sm.sp - 1);
	let refId = PlwBlobRef.make(sm.refMan, blobSize, ptr, mapPtr);
	sm.sp -= blobSize;
	sm.stack[sm.sp - 1] = refId; 
	sm.stackMap[sm.sp - 1] = true;
	return null;
}

/* read_blob(refId Blob, offset integer, size integer)
 */
PLW_LOPS[PLW_LOPCODE_READ_BLOB] = function(sm) {
	if (sm.sp < 3) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let size = sm.stack[sm.sp - 1];
	let offset = sm.stack[sm.sp - 2];
	let refId = sm.stack[sm.sp - 3];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	if (offset < 0 || size < 0 || offset + size > ref.blobSize) {
		return StackMachineError.refAccessOutOfBound();
	}
	sm.sp += size - 3;
	for (let i = 0; i < size; i++) {
		let value = ref.ptr[offset + i];
		let valueIsRef = ref.mapPtr[offset + i];
		sm.stack[sm.sp - size + i] = value;
		sm.stackMap[sm.sp - size + i] = valueIsRef;
		if (valueIsRef) {
			sm.refMan.incRefCount(value, sm.refManError);
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
		}
	}
	sm.refMan.decRefCount(refId, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	return null;
}

/* write_blob(refId Blob, offset integer, val ...integer, size integer)
 */
PLW_LOPS[PLW_LOPCODE_WRITE_BLOB] = function(sm) {
	if (sm.sp < 3) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let size = sm.stack[sm.sp - 1];
	if (size < 0 || sm.sp < 3 + size) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let offset = sm.stack[sm.sp - 2 - size];
	let refId = sm.stack[sm.sp - 3 - size];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	if (offset < 0 || offset + size > ref.blobSize) {
		return StackMachineError.refAccessOutOfBound();
	}
	for (let i = 0; i < size; i++) {
		if (ref.mapPtr[offset + i] === true) {
			sm.refMan.decRefCount(ref.ptr[offset + i], sm.refManError);
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
		}
		ref.ptr[offset + i] = sm.stack[sm.sp - 1 - size + i];
		ref.mapPtr[offset + i] = sm.stackMap[sm.sp - 1 - size + i];
	}
	sm.refMan.decRefCount(refId, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	sm.sp -= 3 + size;
	return null;
}

/* concat_blob(blob ...Blob, itemCount integer)
 */
PLW_LOPS[PLW_LOPCODE_CONCAT_BLOB] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let itemCount = sm.stack[sm.sp - 1];
	if (itemCount < 0 || sm.sp < itemCount + 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let ptrs = new Array(itemCount);
	let mapPtrs = new Array(itemCount);
	let blobSize = 0;
	for (let i = 0; i < itemCount; i++) {
		let refId = sm.stack[sm.sp - itemCount - 1 + i];
		let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
		if (sm.hasRefManError()) {
			return sm.errorFromRefMan();
		}
		ptrs[i] = ref.ptr;
		mapPtrs[i] = ref.mapPtr;
		blobSize += ref.blobSize;
	}
	let ptr = [].concat(...ptrs);
	let mapPtr = [].concat(...mapPtrs);
	for(let i = 0; i < blobSize; i++) {
		if (mapPtr[i] === true) {
			sm.refMan.incRefCount(ptr[i], sm.refManError);
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
		}
	}
	let resultRefId = PlwBlobRef.make(sm.refMan, blobSize, ptr, mapPtr);
	for (let i = 0; i < itemCount; i++) {
		let refId = sm.stack[sm.sp - itemCount - 1 + i];
		sm.refMan.decRefCount(refId, sm.refManError);
		if (sm.hasRefManError()) {
			return sm.errorFromRefMan();
		}
	}
	sm.stack[sm.sp - itemCount - 1] = resultRefId;
	sm.stackMap[sm.sp - itemCount - 1] = true;
	sm.sp -= itemCount;
	return null;
}

/* get_blob_mutable_offset(refId Blob, offset integer)
 */
PLW_LOPS[PLW_LOPCODE_GET_BLOB_MUTABLE_OFFSET] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let offset = sm.stack[sm.sp - 1];
	let refId = sm.stack[sm.sp - 2];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	if (offset < 0 || offset >= ref.blobSize || ref.mapPtr[offset] === false) {
		return StackMachineError.refAccessOutOfBound();
	}
	let value = sm.refMan.makeMutable(ref.ptr[offset], sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	ref.ptr[offset] = value;
	sm.refMan.incRefCount(value, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	sm.refMan.decRefCount(refId, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	sm.stack[sm.sp - 2] = value;
	sm.stackMap[sm.sp - 2] = true;
	sm.sp--;
	return null;
}

/* get_blob_size(refId Blob)
 */
PLW_LOPS[PLW_LOPCODE_GET_BLOB_SIZE] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let refId = sm.stack[sm.sp - 1];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	let blobSize = ref.blobSize;
	sm.refMan.decRefCount(refId, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	sm.stack[sm.sp - 1] = blobSize;
	sm.stackMap[sm.sp - 1] = false;
	return null;
}

/* get_blob_index_of_item(item ...integer, refId Blob, itemSize integer)
 */
PLW_LOPS[PLW_LOPCODE_GET_BLOB_INDEX_OF_ITEM] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let itemSize = sm.stack[sm.sp - 1];
	if (itemSize < 1 && sm.sp < 2 + itemSize) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let refId = sm.stack[sm.sp - 2];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	let indexOf = -1;	
	let baseOffset = sm.sp - 2 - itemSize;
	let ptrOffset = 0;
	for (let i = 0; i < ref.blobSize / itemSize; i++) {
		let isItemEqual = true;
		for (let k = 0; k < itemSize; k++) {
			isItemEqual = ref.mapPtr[k] === true ?
				sm.refMan.compareRefs(sm.stack[baseOffset + k], ref.ptr[ptrOffset + k], sm.refManError) :
				sm.stack[baseOffset + k] === ref.ptr[ptrOffset + k];
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
			if (isItemEqual === false) {
				break;
			}
		}
		if (isItemEqual === true) {
			indexOf = i;
			break;
		}
		ptrOffset += itemSize;
	}
	sm.refMan.decRefCount(refId, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	for (let i = itemSize - 1; i >= 0; i--) {
		if (sm.stackMap[baseOffset + i] === true) {
			sm.refMan.decRefCount(sm.stack[baseOffset + i], sm.refManError);
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
		}
	}
	sm.stack[baseOffset] = indexOf;
	sm.stackMap[baseOffset] = false;
	sm.sp = baseOffset + 1;
	return null;
};

/* slice_blob(refId Blob, beginIndex integer, endIndex integer)
 */
PLW_LOPS[PLW_LOPCODE_SLICE_BLOB] = function(sm) {
	if (sm.sp < 3) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let refId = sm.stack[sm.sp - 3];
	let beginIndex = sm.stack[sm.sp - 2];
	let endIndex = sm.stack[sm.sp - 1];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	if (beginIndex < 0) {
		beginIndex = 0;
	}
	if (endIndex > ref.blobSize) {
		endIndex = ref.blobSize;
	}
	if (endIndex < beginIndex) {
		endIndex = beginIndex;
	}
	let blobSize = endIndex - beginIndex;
	let ptr = ref.ptr.slice(beginIndex, endIndex);
	let mapPtr = ref.mapPtr.slice(beginIndex, endIndex);
	for (let i = 0; i < blobSize; i++) {
		if (mapPtr[i] === true) {
			sm.refMan.incRefCount(ptr[i], sm.refManError);
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
		}
	}
	let resultRefId = PlwBlobRef.make(sm.refMan, blobSize, ptr, mapPtr);
	sm.refMan.decRefCount(refId, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	sm.stack[sm.sp - 3] = resultRefId;
	sm.stackMap[sm.sp - 3] = true;
	sm.sp -= 2;
	return null;
};

/* create_blob_repeat_item(item ...integer, itemCount integer, itemSize integer)
 */
PLW_LOPS[PLW_LOPCODE_CREATE_BLOB_REPEAT_ITEM] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let itemSize = sm.stack[sm.sp - 1];
	if (itemSize < 0 || sm.sp < 2 + itemSize) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let itemCount = sm.stack[sm.sp - 2];
	if (itemCount < 0) {
		itemCount = 0;
	}
	let blobSize = itemCount * itemSize;
	let ptr = new Array(blobSize);
	let mapPtr = new Array(blobSize);
	let baseOffset = sm.sp - 2 - itemSize;
	for (let i = 0; i < itemSize; i++) {
		ptr[i] = sm.stack[baseOffset + i];
		mapPtr[i] = sm.stackMap[baseOffset + i];
	}
	for (let i = itemSize; i < blobSize; i++) {
		ptr[i] = sm.stack[baseOffset + i % itemSize];
		mapPtr[i] = sm.stackMap[baseOffset + i % itemSize];
		if (mapPtr[i] === true) {
			sm.refMan.incRefCount(ptr[i], sm.refManError);
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
		}
	}
	let refId = PlwBlobRef.make(sm.refMan, blobSize, ptr, mapPtr);
	sm.stack[baseOffset] = refId; 
	sm.stackMap[baseOffset] = true;
	sm.sp = baseOffset + 1;
	return null;
}


/* create_exception_handler(offset integer)
 */
PLW_LOPS[PLW_LOPCODE_CREATE_EXCEPTION_HANDLER] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let offset = sm.stack[sm.sp - 1];
	sm.stack[sm.sp - 1] = PlwExceptionHandlerRef.make(sm.refMan, sm.codeBlockId, offset, sm.bp);
	sm.stackMap[sm.sp - 1] = true;
	return null;
}

/* raise_exception(errorCode integer)
 */
PLW_LOPS[PLW_LOPCODE_RAISE_EXCEPTION] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let errorCode = sm.stack[sm.sp - 1];
	while (sm.sp > 0) {
		if (sm.stackMap[sm.sp - 1] === true) {
			let refId = sm.stack[sm.sp - 1];
			let ref = sm.refMan.getRef(refId, sm.refManError);
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
			if (ref.tag === PLW_TAG_REF_EXCEPTION_HANDLER) {
				sm.bp = ref.bp;
				sm.ip = ref.ip;
				sm.codeBlockId = ref.codeBlockId;
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 1] = errorCode;
				sm.stackMap[sm.sp - 1] = false;
				return null;
			}
			sm.refMan.decRefCount(refId, sm.refManError);
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
		}
		sm.sp--;
	}
	return StackMachineError.exception(errorCode).fromCode(sm.codeBlockId, sm.ip);
}

/* create_generator(param ...integer, paramCount integer, codeBlockId integer)
 * layout of the created blob is:
 *     0:   codeBlockId
 *     1:   ip
 *     2:   param1
 *     1+n: paramN
 */
PLW_LOPS[PLW_LOPCODE_CREATE_GENERATOR] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let codeBlockId = sm.stack[sm.sp - 1]
	let paramCount = sm.stack[sm.sp - 2];
	if (paramCount < 0 || sm.sp < paramCount + 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}					
	let ptr = new Array(paramCount + 2);
	let mapPtr = new Array(paramCount + 2);
	ptr[0] = codeBlockId;
	ptr[1] = 0;
	mapPtr[0] = false;
	mapPtr[1] = false;
	for (let i = 0; i < paramCount; i++) {
		ptr[i + 2] = sm.stack[sm.sp - paramCount - 2 + i];
		mapPtr[i + 2] = sm.stackMap[sm.sp - paramCount - 2 + i];
	}
	let refId = PlwBlobRef.make(sm.refMan, paramCount + 2, ptr, mapPtr);
	sm.stack[sm.sp - paramCount - 2] = refId;
	sm.stackMap[sm.sp - paramCount - 2] = true;
	sm.sp -= paramCount + 1;
	return null;	
}

/* get_generator_next_item(refId Generator)
 *
 * make the stack like this:
 *      refId			 parameter already on the stack
 *		oldCodeBlockId
 *      oldIp
 *      oldBp
 *   bp param1			 this and below copied from the generator blob
 *      ...
 *      paramN
 *      local1
 *      ...
 *      localN   
 */
PLW_LOPS[PLW_LOPCODE_GET_GENERATOR_NEXT_ITEM] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let refId = sm.stack[sm.sp - 1];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	if (ref.blobSize < 2) {
		return StackMachineError.refAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp] = sm.codeBlockId;
	sm.stackMap[sm.sp] = false;
	sm.sp++;
	sm.stack[sm.sp] = sm.ip;
	sm.stackMap[sm.sp] = false;
	sm.sp++;
	sm.stack[sm.sp] = sm.bp;
	sm.stackMap[sm.sp] = false;
	sm.sp++;
	sm.bp = sm.sp;
	for (let i = 0; i < ref.blobSize - 2; i++) {
		sm.stack[sm.sp] = ref.ptr[i + 2];
		sm.stackMap[sm.sp] = ref.mapPtr[i + 2];
		ref.mapPtr[i + 2] = false;
		sm.sp++;
	}
	let codeBlockId = ref.ptr[0];
	let ip = ref.ptr[1];
	if (codeBlockId < 0 || codeBlockId >= sm.codeBlocks.length) {
		return StackMachineError.codeAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	if (ip < 0 || ip > sm.codeBlocks[codeBlockId].codeSize) {
		return StackMachineError.codeAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.codeBlockId = codeBlockId;
	sm.ip = ip;
	return null;
}

/* has_generator_ended(refId Generator)
 */
PLW_LOPS[PLW_LOPCODE_HAS_GENERATOR_ENDED] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let refId = sm.stack[sm.sp - 1];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	if (ref.blobSize < 2) {
		return StackMachineError.refAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let codeBlockId = ref.ptr[0];
	if (codeBlockId < 0 || codeBlockId >= sm.codeBlocks.length) {
		return StackMachineError.codeAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let ended = ref.ptr[1] >= sm.codeBlocks[codeBlockId].codeSize ? 1 : 0;
	sm.refMan.decRefCount(sm.stack[sm.sp - 1], sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	sm.stack[sm.sp - 1] = ended;
	sm.stackMap[sm.sp - 1] = false;
	return null;
}

/* yield_generator_item(item ...integer, itemSize)
 * 
 * in a generator, the stack is like this:
 *      refId			 refId of the generator
 *		oldCodeBlockId
 *      oldIp
 *      oldBp
 *   bp param1			 this and below copied from the generator blob
 *      ...
 *      paramN
 *      local1
 *      ...
 *      localN   
 */
PLW_LOPS[PLW_LOPCODE_YIELD_GENERATOR_ITEM] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let itemSize = sm.stack[sm.sp - 1];
	if (sm.bp < 4 || itemSize < 0 || sm.sp < sm.bp + itemSize + 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let refId = sm.stack[sm.bp - 4];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.refManError.hasError()) {
		return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
	}
	ref.resize(2 + (sm.sp - sm.bp) - itemSize - 1);
	ref.ptr[1] = sm.ip;
	for (let i = 0; i < sm.sp - sm.bp - itemSize - 1; i++) {
		ref.ptr[i + 2] = sm.stack[sm.bp + i];
		ref.mapPtr[i + 2] = sm.stackMap[sm.bp + i];
	}
	let previousBp = sm.stack[sm.bp - 1];
	let previousIp = sm.stack[sm.bp - 2];
	let previousCodeBlockId = sm.stack[sm.bp - 3];
	for (let i = 0; i < itemSize; i++) {
		sm.stack[sm.bp - 4 + i] = sm.stack[sm.sp - itemSize - 1 + i];
		sm.stackMap[sm.bp - 4 + i] = sm.stackMap[sm.sp - itemSize - 1 + i];
	}
	sm.sp = sm.bp - 4 + itemSize;
	sm.bp = previousBp;
	sm.codeBlockId = previousCodeBlockId;
	sm.ip = previousIp;
	sm.refMan.decRefCount(refId, sm.refManError);		
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	return null;
}

"use strict";

class NativeFunctionManager {
	constructor() {
		this.functions = [];
		this.functionCount = 0;
	}
	
	addFunction(f) {
		let i = this.functionCount;
		this.functions[i] = f;
		this.functionCount++;
		return i;
	}
	
	
	static initStdNativeFunctions(compiler) {
		let nativeFunctionManager = new NativeFunctionManager();	
				
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"get_char",
			new EvalResultParameterList(0, []),
			EVAL_TYPE_CHAR,
			nativeFunctionManager.addFunction(function(sm) {
				return StackMachineError.trap("@get_char");
			})
		));	
		
		compiler.context.addProcedure(EvalResultProcedure.fromNative(
			"write",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				addTextOut(ref.str);
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.sp -= 2;
				return null;
			})
		));		
		
		compiler.context.addProcedure(EvalResultProcedure.fromNative(
			"print",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				printTextOut(ref.str);
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.sp -= 2;
				return null;
			})
		));

		compiler.context.addFunction(EvalResultFunction.fromNative(
			"print",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				printTextOut(ref.str);
				sm.sp -= 1;
				return null;
			})
		));

		compiler.context.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_INTEGER)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 2] = PlwStringRef.make(sm.refMan, "" + sm.stack[sm.sp - 2]);
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_REAL)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 2] = PlwStringRef.make(sm.refMan, "" + sm.stack[sm.sp - 2]);
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_CHAR)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 2] = PlwStringRef.make(sm.refMan, String.fromCharCode(sm.stack[sm.sp - 2]));
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_BOOLEAN)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 2] = PlwStringRef.make(sm.refMan, sm.stack[sm.sp - 2] === 1 ? "true" : "false");
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));
							
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"length",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let len = ref.str.length;
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 2] = len;
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
				
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compiler.addType(new EvalTypeArray(EVAL_TYPE_CHAR)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let resultId = PlwStringRef.make(sm.refMan, String.fromCharCode(...ref.ptr));
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));

		compiler.context.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compiler.addType(new EvalTypeArray(EVAL_TYPE_INTEGER)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let resultId = PlwStringRef.make(sm.refMan, "[" + ref.ptr + "]");
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compiler.addType(new EvalTypeArray(EVAL_TYPE_BOOLEAN)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let resultId = PlwStringRef.make(sm.refMan, "[" + ref.ptr + "]");
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));

		compiler.context.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compiler.addType(new EvalTypeArray(EVAL_TYPE_TEXT)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let str = "[";
				for (let i = 0; i < ref.blobSize; i++) {
					let subRef = sm.refMan.getRefOfType(ref.ptr[i], PLW_TAG_REF_STRING, sm.refManError);
					if (sm.hasRefManError()) {
						return sm.errorFromRefMan();
					}
					str += (i > 0 ? ", " : "") + subRef.str;
				}
				str += "]";
				let resultId = PlwStringRef.make(sm.refMan, str);
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));

		compiler.context.addFunction(EvalResultFunction.fromNative(
			"concat",
			new EvalResultParameterList(2, [
				new EvalResultParameter("t1", EVAL_TYPE_TEXT),
				new EvalResultParameter("t2", EVAL_TYPE_TEXT)
			]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId1 = sm.stack[sm.sp - 3];
				let refId2 = sm.stack[sm.sp - 2];
				let ref1 = sm.refMan.getRefOfType(refId1, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let ref2 = sm.refMan.getRefOfType(refId2, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				if (ref1.refCount === 1) {
					ref1.str += ref2.str;
					sm.refMan.decRefCount(refId2, sm.refManError);
					if (sm.hasRefManError()) {
						return sm.errorFromRefMan();
					}
				} else {
					let resultRefId = PlwStringRef.make(sm.refMan, ref1.str + ref2.str);
					sm.refMan.decRefCount(refId1, sm.refManError);
					if (sm.hasRefManError()) {
						return sm.errorFromRefMan();
					}
					sm.refMan.decRefCount(refId2, sm.refManError);
					if (sm.hasRefManError()) {
						return sm.errorFromRefMan();
					}
					sm.stack[sm.sp - 3] = resultRefId;
					sm.stackMap[sm.sp - 3] = true;
				}
				sm.sp -= 2;
				return null;
			})
		));


		compiler.context.addFunction(EvalResultFunction.fromNative(
			"subtext",
			new EvalResultParameterList(3, [
				new EvalResultParameter("t", EVAL_TYPE_TEXT),
				new EvalResultParameter("beginIndex", EVAL_TYPE_INTEGER),
				new EvalResultParameter("length", EVAL_TYPE_INTEGER),
			]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 3) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 4];
				let beginIndex = sm.stack[sm.sp - 3];
				let length = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				if (beginIndex < 0) {
					return StackMachineError.refAccessOutOfBound();
				}
				if (length < 0) {
					length = 0;
				}
				if (beginIndex + length > ref.str.length) {
					return StackMachineError.refAccessOutOfBound();
				}
				let resultRefId = PlwStringRef.make(sm.refMan, length === 0 ? "" : ref.str.substr(beginIndex, length));
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 4] = resultRefId;
				sm.stackMap[sm.sp - 4] = true;
				sm.sp -= 3;
				return null;
			})
		));	
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"subtext",
			new EvalResultParameterList(2, [
				new EvalResultParameter("t", EVAL_TYPE_TEXT),
				new EvalResultParameter("beginIndex", EVAL_TYPE_INTEGER)
			]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 3];
				let beginIndex = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				if (beginIndex < 0) {
					return StackMachineError.refAccessOutOfBound();
				}
				if (beginIndex > ref.str.length) {
					return StackMachineError.refAccessOutOfBound();
				}
				let resultRefId = PlwStringRef.make(sm.refMan, ref.str.substr(beginIndex));
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 3] = resultRefId;
				sm.stackMap[sm.sp - 3] = true;
				sm.sp -= 2;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"trim",
			new EvalResultParameterList(1, [
				new EvalResultParameter("t", EVAL_TYPE_TEXT)
			]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let resultRefId = PlwStringRef.make(sm.refMan, ref.str.trim());
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 2] = resultRefId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));	

		compiler.context.addFunction(EvalResultFunction.fromNative(
			"char_code",
			new EvalResultParameterList(2, [
				new EvalResultParameter("t", EVAL_TYPE_TEXT),
				new EvalResultParameter("i", EVAL_TYPE_INTEGER)
			]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 3];
				let index = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				if (index < 0 || index >= ref.str.length) {
					return StackMachineError.refAccessOutOfBound();
				}
				let charCode = ref.str.charCodeAt(index)
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 3] = charCode;
				sm.stackMap[sm.sp - 3] = false;
				sm.sp -= 2;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"char_at",
			new EvalResultParameterList(2, [
				new EvalResultParameter("t", EVAL_TYPE_TEXT),
				new EvalResultParameter("i", EVAL_TYPE_INTEGER)
			]),
			EVAL_TYPE_CHAR,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 3];
				let index = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				if (index < 0 || index >= ref.str.length) {
					return StackMachineError.refAccessOutOfBound();
				}
				let charCode = ref.str.charCodeAt(index)
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 3] = charCode;
				sm.stackMap[sm.sp - 3] = false;
				sm.sp -= 2;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"index_of",
			new EvalResultParameterList(2, [
				new EvalResultParameter("c", EVAL_TYPE_CHAR),
				new EvalResultParameter("t", EVAL_TYPE_TEXT)
			]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let ch = sm.stack[sm.sp - 3];
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let index = ref.str.indexOf(String.fromCharCode(ch));
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 3] = index;
				sm.stackMap[sm.sp - 3] = false;
				sm.sp -= 2;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"index_of",
			new EvalResultParameterList(2, [
				new EvalResultParameter("c", EVAL_TYPE_TEXT),
				new EvalResultParameter("t", EVAL_TYPE_TEXT)
			]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refIdSub = sm.stack[sm.sp - 3];
				let refSub = sm.refMan.getRefOfType(refIdSub, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let index = ref.str.indexOf(refSub.str);
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.refMan.decRefCount(refIdSub, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 3] = index;
				sm.stackMap[sm.sp - 3] = false;
				sm.sp -= 2;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"split",
			new EvalResultParameterList(2, [
				new EvalResultParameter("t", EVAL_TYPE_TEXT),
				new EvalResultParameter("s", EVAL_TYPE_TEXT)
			]),
			compiler.addType(new EvalTypeArray(EVAL_TYPE_TEXT)),
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 3];
				let sepId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let sep = sm.refMan.getRefOfType(sepId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let strs = ref.str.split(sep.str);
				let strIds = new Array(strs.length);
				for (let i = 0; i < strs.length; i++) {
					strIds[i] = PlwStringRef.make(sm.refMan, strs[i]);
				}
				let resultId = PlwBlobRef.make(sm.refMan, strs.length, strIds, new Array(strs.length).fill(true));
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.refMan.decRefCount(sepId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 3] = resultId;
				sm.stackMap[sm.sp - 3] = true;
				sm.sp -= 2;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"abs",
			new EvalResultParameterList(1, [new EvalResultParameter("i", EVAL_TYPE_INTEGER)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();				
				}
				let val = sm.stack[sm.sp -2];
				if (val < 0) {
					sm.stack[sm.sp -2] = -val;
				}
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"real",
			new EvalResultParameterList(1, [new EvalResultParameter("i", EVAL_TYPE_INTEGER)]),
			EVAL_TYPE_REAL,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));

		compiler.context.addFunction(EvalResultFunction.fromNative(
			"sqrt",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_REAL)]),
			EVAL_TYPE_REAL,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 2] = Math.sqrt(sm.stack[sm.sp - 2]);
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"log",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_REAL)]),
			EVAL_TYPE_REAL,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 2] = Math.log(sm.stack[sm.sp - 2]);
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"now",
			new EvalResultParameterList(0, []),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 0) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 1] = Date.now();
				sm.stackMap[sm.sp - 1] = false;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"random",
			new EvalResultParameterList(2, [
				new EvalResultParameter("low_bound", EVAL_TYPE_INTEGER),
				new EvalResultParameter("high_bound", EVAL_TYPE_INTEGER)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let lowBound = sm.stack[sm.sp - 3];
				let highBound = sm.stack[sm.sp - 2];
				sm.stack[sm.sp - 3] = Math.floor(Math.random() * (highBound - lowBound + 1)) + lowBound;
				sm.stackMap[sm.sp - 3] = false;
				sm.sp -= 2;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"integer",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				let result = parseInt(ref.str);
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 2] = result;
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"ceil",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_REAL)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 2] = Math.ceil(sm.stack[sm.sp - 2]);
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
		
		compiler.context.addFunction(EvalResultFunction.fromNative(
			"floor",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_REAL)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				sm.stack[sm.sp - 2] = Math.floor(sm.stack[sm.sp - 2]);
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
		
		return nativeFunctionManager;
	}
}

const fs = require("fs");
const stream = require("stream");

function addTextOut(txt) {
	process.stdout.write(txt);
}

function printTextOut(txt) {
	console.log(txt);
}

let compilerContext = new CompilerContext();
let nativeFunctionManager = NativeFunctionManager.initStdNativeFunctions(new Compiler(compilerContext));
let stackMachine = new StackMachine();

if (process.argv.length < 4) {
	console.log("Usage: plwc.sh <source file> <output file>");
	process.exit(1);
}

let inFileName = process.argv[2];
let outFileName = process.argv[3];

const sourceCode = fs.readFileSync(inFileName, 'utf8');

let tokenReader = new TokenReader(sourceCode, 1, 1);
let parser = new Parser(tokenReader);
let compiler = new Compiler(compilerContext);

let rootCodeBlocks = [];

while (parser.peekToken() !== TOK_EOF) {
	let expr = parser.readStatement();
	if (Parser.isError(expr)) {
		console.log(expr);
		break;
	}
	compiler.resetCode();
	let result = compiler.evalStatement(expr);
	if (result.isError()) {
		console.log(result);
		process.exit(2);
		break;
	}
	if (compiler.codeBlock.codeSize > 0) {
		rootCodeBlocks[rootCodeBlocks.length] = compiler.codeBlock;
	}
}

let codeBlockId = compilerContext.codeBlocks.length;
let codeBlocks = [...compilerContext.codeBlocks, ...rootCodeBlocks];
let codeBlockCount = codeBlocks.length;
let compiled = "" + codeBlockCount + " " + codeBlockId + "\n";
for (let i = 0; i < codeBlockCount; i++) {
	let cb = codeBlocks[i];
	compiled += cb.blockName.length + " " + cb.blockName + "\n" + cb.strConstSize + "\n";
	for (let j = 0; j < cb.strConstSize; j++) {
		compiled += cb.strConsts[j].length + " " + cb.strConsts[j] + "\n";
	}
	compiled += cb.floatConstSize + "\n";
	for (let j = 0; j < cb.floatConstSize; j++) {
		compiled += cb.floatConsts[j] + "\n";
	}		
	compiled += cb.codeSize + "\n";
	for (let j = 0; j < cb.codeSize; j++) {
		compiled += cb.codes[j] + " ";
		if (j % 50 == 49) {
			compiled += "\n";
		}
	}
	compiled += "\n";
}

fs.writeFileSync(outFileName, compiled);

