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

class AstTypeVariantField extends AstNode {
	constructor(fieldName, fieldType) {
		super("ast-type-variant-field");
		this.fieldName = fieldName;
		this.fieldType = fieldType;
	}
}

class AstTypeVariant extends AstNode {
	constructor(fieldCount, fields) {
		super("ast-type-variant");
		this.fieldCount = fieldCount;
		this.fields = fields;
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

class AstVariableDeclaration extends AstNode {
	constructor(varName, valueExpr, isConst) {
		super("ast-variable-declaration");
		this.varName = varName;
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

class AstRange extends AstNode {
	constructor(lowerBound, upperBound) {
		super("ast-range");
		this.lowerBound = lowerBound;
		this.upperBound = upperBound;
	}
}

class AstParameter extends AstNode {
	constructor(parameterName, parameterType, isCtx) {
		super("ast-parameter");
		this.parameterName = parameterName;
		this.parameterType = parameterType;
		this.isCtx = isCtx;
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

class AstCtxArg extends AstNode {
	constructor(varName) {
		super("ast-ctx-arg");
		this.varName = varName;
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
	constructor(kindName, varName, thenExpr) {
		super("ast-kindof-when");
		this.kindName = kindName;
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
	constructor(kindName, varName, thenBlock) {
		super("ast-kindof-when-stmt");
		this.kindName = kindName;
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
		} else if (this.peekToken() === TOK_RETURN) {
			stmt = this.readReturn();
		} else if (this.peekToken() === TOK_YIELD) {
			stmt = this.readYield();
		} else if (this.peekToken() === TOK_RAISE) {
			stmt = this.readRaise();
		} else if (this.peekToken() == TOK_FOR) {
			stmt = this.readFor();
		} else if (this.peekToken() == TOK_BEGIN) {
			stmt = this.readAnonymousBlock();
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
		let left = this.readExpr3();
		if (Parser.isError(left)) {
			return left;
		}
		
		if (
			this.peekToken() === TOK_EQ ||
			this.peekToken() === TOK_GT ||
			this.peekToken() === TOK_LT ||
			this.peekToken() === TOK_GTE ||
			this.peekToken() === TOK_LTE ||
			this.peekToken() === TOK_NE
		) {
			let operator = this.readToken();
			let right = this.readExpr3();
			if (Parser.isError(right)) {
				return right;
			}
			left = new AstOperatorBinary(operator.tag, left, right).fromToken(operator);
		}
		
		return left;
	}

	readExpr3() {
		let left = this.readExpr2();		
		if (Parser.isError(left)) {
			return left;
		}
			
		while (
			this.peekToken() === TOK_ADD ||
			this.peekToken() === TOK_SUB ||
			this.peekToken() === TOK_CONCAT
		) {
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
		
		if (this.peekToken() === TOK_AS) {
			let asToken = this.readToken();
			let exprType = this.readType();
			if (Parser.isError(exprType)) {
				return exprType;
			}
			return new AstAs(expr, exprType).fromToken(asToken);
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
		let kindNameToken = this.readToken();
		if (kindNameToken.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(kindNameToken, [TOK_IDENTIFIER]);
		}
		let varName = null;
		if (this.peekToken() === TOK_BEGIN_GROUP) {
			this.readToken();
			let varNameToken = this.readToken();
			if (varNameToken.tag !== TOK_IDENTIFIER) {
				return ParserError.unexpectedToken(varNameToken, [TOK_IDENTIFIER]);
			}
			varName = varNameToken.text;
			let closeToken = this.readToken();
			if (closeToken.tag !== TOK_END_GROUP) {
				return ParserError.unexpectedToken(closeToken, [TOK_END_GROUP]);
			}
		}
		let thenToken = this.readToken();
		if (thenToken.tag !== TOK_THEN) {
			return ParserError.unexpectedToken(thenToken, [TOK_THEN]);
		}
		let thenExpr = this.readExpression();
		if (Parser.isError(thenExpr)) {
			return thenExpr;
		}
		return new AstKindofWhen(kindNameToken.text, varName, thenExpr);
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
		let kindNameToken = this.readToken();
		if (kindNameToken.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(kindNameToken, [TOK_IDENTIFIER]);
		}
		let varName = null;
		if (this.peekToken() === TOK_BEGIN_GROUP) {
			this.readToken();
			let varNameToken = this.readToken();
			if (varNameToken.tag !== TOK_IDENTIFIER) {
				return ParserError.unexpectedToken(varNameToken, [TOK_IDENTIFIER]);
			}
			varName = varNameToken.text;
			let closeToken = this.readToken();
			if (closeToken.tag !== TOK_END_GROUP) {
				return ParserError.unexpectedToken(closeToken, [TOK_END_GROUP]);
			}
		}
		let thenBlock = this.readBlockUntil(TOK_THEN, [TOK_WHEN, TOK_ELSE, TOK_END]);
		if (Parser.isError(thenBlock)) {
			return thenBlock;
		}
		return new AstKindofWhenStmt(kindNameToken.text, varName, thenBlock);
	}

	readExprGroup() {
		let openToken = this.readToken();
		if (openToken.tag !== TOK_BEGIN_GROUP) {
			return ParserError.unexpectedToken(openToken, [TOK_BEGIN_GROUP]);			
		}
		let groupExpr = this.readExpression();
		if (Parser.isError(groupExpr)) {
			return groupExpr;
		}
		let closeToken = this.readToken();
		if (closeToken.tag !== TOK_END_GROUP) {
			return ParserError.unexpectedToken(closeToken, [TOK_END_GROUP]);			
		}
		return groupExpr;
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
		if (this.peekToken() === TOK_SEQUENCE) {
			return this.readTypeSequence();
		}
		if (this.peekToken() === TOK_VARIANT) {
			return this.readTypeVariant();
		}
		if (this.peekToken() === TOK_BEGIN_AGG) {
			return this.readTypeRecord();
		}
		if (this.peekToken() === TOK_BEGIN_ARRAY) {
			return this.readTypeArray();
		}
		if (this.peekToken() === TOK_ABSTRACT) {
			return this.readTypeAbstract();
		}
		let typeName = this.readToken();
		if (typeName.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(typeName, [TOK_IDENTIFIER, TOK_BEGIN_ARRAY, TOK_BEGIN_AGG, TOK_SEQUENCE]);
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
	
	readTypeVariant() {
		let variantToken = this.readToken();
		if (variantToken.tag !== TOK_VARIANT) {
			return ParserError.unexpectedToken(variantToken, [TOK_VARIANT]);
		}
		let openToken = this.readToken();
		if (openToken.tag !== TOK_BEGIN_GROUP) {
			return ParserError.unexpectedToken(openToken, [TOK_BEGIN_GROUP]);
		}
		let fields = [];
		let fieldIndex = 0;
		while (this.peekToken() !== TOK_END_GROUP) {
			if (fieldIndex > 0) {
				let sepToken = this.readToken();
				if (sepToken.tag !== TOK_SEP) {
					return ParserError.unexpectedToken(sepToken, [TOK_SEP, TOK_END_GROUP]);
				}
			}
			let fieldExpr = this.readTypeVariantField();
			if (Parser.isError(fieldExpr)) {
				return fieldExpr;
			}
			fields[fieldIndex] = fieldExpr;
			fieldIndex++;
		}
		let closeToken = this.readToken();
		if (closeToken.tag !== TOK_END_GROUP) {
			return ParserError.unexpectedToken(closeToken, [TOK_END_GROUP]);
		}
		return new AstTypeVariant(fieldIndex, fields).fromToken(openToken);		
	}
	
	readTypeAbstract() {
		let abstractToken = this.readToken();
		if (abstractToken.tag !== TOK_ABSTRACT) {
			return ParserError.unexpectedToken(abstractToken, [TOK_ABSTRACT]);
		}
		let openToken = this.readToken();
		if (openToken.tag !== TOK_BEGIN_GROUP) {
			return ParserError.unexpectedToken(openToken, [TOK_BEGIN_GROUP]);
		}
		let methodCount = 0;
		let methods = [];
		while (this.peekToken() !== TOK_END_GROUP) {
			let method = this.readTypeAbstractMethod();
			if (Parser.isError(method)) {
				return method;
			}
			methods[methodCount] = method;
			methodCount++;
			if (this.peekToken() !== TOK_END_GROUP) {
				let sepToken = this.readToken();
				if (sepToken.tag !== TOK_SEP) {
					return ParserError.unexpectedToken(sepToken, [TOK_SEP, TOK_END_GROUP]);
				}
			}
		}
		let closeToken = this.readToken();
		if (closeToken.tag !== TOK_END_GROUP) {
			return ParserError.unexpectedToken(closeToken, [TOK_END_GROUP]);
		}
		return new AstTypeAbstract(methodCount, methods).fromToken(abstractToken);
	}
	
	readTypeAbstractMethod() {
		let methodName = this.readToken();
		if (methodName.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(methodName, [TOK_IDENTIFIER]);
		}
		let parameterList = this.readParameterList();
		if (Parser.isError(parameterList)) {
			return parameterList;
		}
		let returnType = null;
		if (this.peekToken() !== TOK_SEP && this.peekToken() !== TOK_END_GROUP) {
			returnType = this.readType();
			if (Parser.isError(returnType)) {
				return returnType;
			}
		}
		return new AstTypeAbstractMethod(methodName.text, parameterList, returnType).fromToken(methodName);
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
		let varName = this.readToken();
		if (varName.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(varName, [TOK_IDENTIFIER])
		}
		let assign = this.readToken();
		if (assign.tag !== TOK_ASSIGN) {
			return ParserError.unexpectedToken(assign, [TOK_ASSIGN]);
		}
		let expr = this.readExpression();
		if (Parser.isError(expr)) {
			return expr;
		}
		return new AstVariableDeclaration(varName.text, expr, varToken.tag === TOK_CONST).fromToken(varToken);
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
		let isCtx = false;
		if (isGenerator === false && this.peekToken() == TOK_CTX) {
			this.readToken();
			isCtx = true;
		}
		let parameterName = this.readToken();
		if (parameterName.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(parameterName, [TOK_IDENTIFIER])
		}
		let parameterType = this.readType();
		if (Parser.isError(parameterType)) {
			return parameterType;
		}
		return new AstParameter(parameterName.text, parameterType, isCtx).fromToken(parameterName);	
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
			let arg = null;
			if (this.peekToken() == TOK_CTX) {
				this.readToken();
				let varName = this.readToken();
				if (varName.tag !== TOK_IDENTIFIER) {
					return ParserError.unexpectedToken(varName, [TOK_IDENTIFIER]);
				}
				arg = new AstCtxArg(varName.text).fromToken(varName);
			} else {
				arg = this.readExpression();
				if (Parser.isError(arg)) {
					return arg;
				}
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

// no arg

const OPCODE_DEBUG										= 1;
const OPCODE_DUP										= 2;
const OPCODE_SWAP										= 3;
const OPCODE_ADD										= 4;
const OPCODE_ADDF										= 5;
const OPCODE_SUB										= 6;
const OPCODE_SUBF										= 7;
const OPCODE_DIV										= 8;
const OPCODE_DIVF										= 9;
const OPCODE_REM										= 10;
const OPCODE_MUL										= 11;
const OPCODE_MULF										= 12;
const OPCODE_NEG										= 13;
const OPCODE_NEGF										= 14;
const OPCODE_GT											= 15;
const OPCODE_GTF										= 16;
const OPCODE_LT											= 17;
const OPCODE_LTF										= 18;
const OPCODE_GTE										= 19;
const OPCODE_GTEF										= 20;
const OPCODE_LTE										= 21;
const OPCODE_LTEF										= 22;
const OPCODE_AND										= 23;
const OPCODE_OR											= 24;
const OPCODE_NOT										= 25;
const OPCODE_EQ											= 26;
const OPCODE_EQF										= 27;
const OPCODE_EQ_REF										= 28;
const OPCODE_NE											= 29;
const OPCODE_NEF										= 30;
const OPCODE_PUSH_PTR_OFFSET							= 31;
const OPCODE_PUSH_PTR_OFFSET_FOR_MUTATE					= 32;
const OPCODE_POP_PTR_OFFSET								= 33;
const OPCODE_RAISE										= 34;
const OPCODE_RET_VAL									= 35;
const OPCODE_RET										= 36;
const OPCODE_YIELD										= 37;
const OPCODE_YIELD_DONE									= 38;
const OPCODE_NEXT										= 39;
const OPCODE_ENDED										= 40;
const OPCODE_BASIC_ARRAY_TIMES							= 41;
const OPCODE_ARRAY_TIMES								= 42;

const OPCODE1_MAX										= 99;
			
// One arg			
			
const OPCODE_JZ											= 100;
const OPCODE_JNZ										= 101;
const OPCODE_JMP										= 102;
const OPCODE_PUSH										= 103;
const OPCODE_PUSH_GLOBAL								= 104;
const OPCODE_PUSH_GLOBAL_FOR_MUTATE						= 105;
const OPCODE_PUSH_LOCAL									= 106;
const OPCODE_PUSH_LOCAL_FOR_MUTATE						= 107;
const OPCODE_PUSH_INDIRECTION							= 108;
const OPCODE_PUSH_INDIRECT								= 109;
const OPCODE_PUSH_INDIRECT_FOR_MUTATE					= 110;
const OPCODE_POP_GLOBAL									= 111;
const OPCODE_POP_LOCAL									= 112;
const OPCODE_POP_INDIRECT								= 113;
const OPCODE_POP_VOID									= 114;
const OPCODE_CREATE_STRING								= 115;
const OPCODE_CREATE_RECORD								= 116;
const OPCODE_CREATE_BASIC_ARRAY							= 117;
const OPCODE_CREATE_ARRAY							 	= 118;
const OPCODE_CALL										= 119;
const OPCODE_CALL_ABSTRACT								= 120;
const OPCODE_CALL_NATIVE								= 121;
const OPCODE_INIT_GENERATOR								= 122;
const OPCODE_CREATE_EXCEPTION_HANDLER					= 123;

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
	constructor(tag, isRef, isMutable) {
		super(tag);
		this.isRef = isRef;
		this.isMutable = isMutable;
	}
	
	typeKey() {
		return "not managed " + evalType;
	}
}

class EvalTypeBuiltIn extends EvalResultType {
	constructor(typeName, isRef) {
		super("res-type-built-in", isRef, false);
		this.typeName = typeName;
	}
	
	typeKey() {
		return this.typeName;
	}
	
}

class EvalTypeRecordField {
	constructor(fieldName, fieldType) {
		this.fieldName = fieldName;
		this.fieldType = fieldType;
		this.offset = 0;
	}
}

class EvalTypeRecord extends EvalResultType {
	constructor(fieldCount, fields) {
		super("res-type-record", true, true);
		this.fieldCount = fieldCount;
		this.fields = fields;
		this.refFieldCount = 0;
		for (let i = 0; i < fields.length; i++) {
			if (fields[i].fieldType.isRef) {
				fields[i].offset = this.refFieldCount;
				this.refFieldCount++;
			}
		}
		let noRefIndex = this.refFieldCount;
		for (let i = 0; i < fields.length; i++) {
			if (!fields[i].fieldType.isRef) {
				fields[i].offset = noRefIndex;
				noRefIndex++;
			}
		}
	}
	
	typeKey() {
		let name = "{";
		for (let i = 0; i < this.fieldCount; i++) {
			name += (i == 0 ? "" : ", ") + this.fields[i].fieldName + " " + this.fields[i].fieldType.typeKey();
		}
		return name + "}";
	}
}

class EvalTypeVariantField {
	constructor(fieldName, fieldType) {
		this.fieldName = fieldName;
		this.fieldType = fieldType;
		this.builder = null;
	}
}

class EvalTypeVariant extends EvalResultType {
	constructor(fieldCount, fields) {
		super("res-type-variant", true, false);
		this.fieldCount = fieldCount;
		this.fields = fields;
	}

	typeKey() {
		let name = "variant(";
		for (let i = 0; i < this.fieldCount; i++) {
			name += (i == 0 ? "" : ", ") + this.fields[i].fieldName;
			if (this.fields[i].fieldType !== null) {
				name += " " + this.fields[i].fieldType.typeKey();
			}
		}
		return name + ")";
	}
}

class EvalTypeArray extends EvalResultType {
	constructor(underlyingType) {
		super("res-type-array", true, true);
		this.underlyingType = underlyingType;
	}
	
	typeKey() {
		return "[" + (this.underlyingType === null ? "" : this.underlyingType.typeKey()) + "]";
	}
}

class EvalTypeSequence extends EvalResultType {
	constructor(underlyingType) {
		super("res-type-sequence", true, false);
		this.underlyingType = underlyingType;
	}
	
	typeKey() {
		return "sequence(" + (this.underlyingType === null ? "" : this.underlyingType.typeKey()) + ")";
	}
}

class EvalTypeAbstract extends EvalResultType {
	constructor(methodCount, methods) {
		super("res-type-abstract", true, false);
		this.methodCount = methodCount;
		this.methods = methods;
	}
	
	typeKey() {
		let name = "abstract(";
		for(let i = 0; i < this.methodCount; i++) {
			if (i > 0) {
				name += ", ";
			}
			name += this.methods[i].typeKey();
		}
		return name += ")";
	}
}

class EvalTypeAbstractMethod {
	constructor(isFunction, methodName, paramCount, params, returnType) {
		this.isFunction = isFunction;
		this.methodName = methodName;
		this.paramCount = paramCount;
		this.params = params;
		this.returnType = returnType; 
	}
	
	typeKey() {
		let name = this.methodName + "(";
		for(let i = 0; i < this.paramCount; i++) {
			if (i > 0) {
				name += ", ";
			}
			name += this.params[i].typeKey();
		}
		return name + ")" + (this.returnType === null ? (this.isFunction ? " self" : "") : " " + this.returnType.typeKey());
	}
	
	methodKey(concreteType, abstractType) {
		let key = this.methodName + "(" + concreteType.typeKey();
		for (let i = 0; i < this.paramCount; i++) {
			key += "," + (this.params[i].paramType === null ? abstractType.typeKey() : this.params[i].paramType.typeKey());
		}
		return key + ")";
	}
}

class EvalTypeAbstractParam {
	constructor(paramName, paramType) {
		this.paramName = paramName;
		this.paramType = paramType; 
	}
	
	typeKey() {
		return this.paramName + (this.paramType === null ? " self" : " " + this.paramType.typeKey());
	}
}

class EvalTypeName extends EvalResultType {
	constructor(typeName, underlyingType) {
		super("res-type-name", underlyingType.isRef, underlyingType.isMutable);
		this.typeName = typeName;
		this.underlyingType = underlyingType;
	}
	
	typeKey() {
		return this.typeName;
	}
}

class EvalResultParameter extends EvalResult {
	constructor(parameterName, parameterType, isCtx) {
		super("res-parameter");
		this.parameterName = parameterName;
		this.parameterType = parameterType;
		this.isCtx = isCtx;
	}
}

class EvalResultParameterList extends EvalResult {
	constructor(parameterCount, parameters) {
		super("res-parameter-list");
		this.parameterCount = parameterCount;
		this.parameters = parameters;
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
		this.abstractIndex = -1;
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
				(this.parameterList.parameters[i].isCtx ? "ctx " : "") +
				this.parameterList.parameters[i].parameterType.typeKey();
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
		this.abstractIndex = -1;
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
				(this.parameterList.parameters[i].isCtx ? "ctx " : "") +
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
		
}

const EVAL_TYPE_REF = new EvalTypeBuiltIn("ref", true);
const EVAL_TYPE_INTEGER = new EvalTypeBuiltIn("integer", false);
const EVAL_TYPE_REAL = new EvalTypeBuiltIn("real", false);
const EVAL_TYPE_BOOLEAN = new EvalTypeBuiltIn("boolean", false);
const EVAL_TYPE_TEXT = new EvalTypeBuiltIn("text", true);
const EVAL_TYPE_CHAR = new EvalTypeName("char", EVAL_TYPE_INTEGER);

class CodeBlock {

	constructor(blockName) {
		this.blockName = blockName;
		this.codes = [];
		this.codeSize = 0;
		this.strConsts = [];
		this.strConstSize = 0;
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
	
	setLoc(offset) {
		this.codes[offset] = this.codeSize;
	}
	
	code1(inst) {
		this.codes[this.codeSize] = inst;
		this.codeSize++;
	}
	
	code2(inst, arg) {
		this.codes[this.codeSize] = inst;
		this.codeSize++;
		this.codes[this.codeSize] = arg;
		this.codeSize++;
	}
	
	codeDup() {
		this.code1(OPCODE_DUP);
	}
	
	codeSwap() {
		this.code1(OPCODE_SWAP);
	}
	
	codePush(val) {
		this.code2(OPCODE_PUSH, val);
	}
		
	codePushGlobal(offset) {
		this.code2(OPCODE_PUSH_GLOBAL, offset);
	}
	
	codePushGlobalForMutate(offset) {
		this.code2(OPCODE_PUSH_GLOBAL_FOR_MUTATE, offset);
	}
	
	codePushLocal(offset) {
		this.code2(OPCODE_PUSH_LOCAL, offset);
	}
	
	codePushLocalForMutate(offset) {
		this.code2(OPCODE_PUSH_LOCAL_FOR_MUTATE, offset);
	}	
	
	codePushIndirection(offset) {
		this.code2(OPCODE_PUSH_INDIRECTION, offset);
	}
	
	codePushIndirect(offset) {
		this.code2(OPCODE_PUSH_INDIRECT, offset);
	}
	
	codePushIndirectForMutate(offset) {
		this.code2(OPCODE_PUSH_INDIRECT_FOR_MUTATE, offset);
	}

	codePushPtrOffset() {
		this.code1(OPCODE_PUSH_PTR_OFFSET);
	}
	
	codePushPtrOffsetForMutate() {
		this.code1(OPCODE_PUSH_PTR_OFFSET_FOR_MUTATE);
	}
	
	codeCreateRecord(itemCount) {
		this.code2(OPCODE_CREATE_RECORD, itemCount);
	}
	
	codeCreateBasicArray(itemCount) {
		this.code2(OPCODE_CREATE_BASIC_ARRAY, itemCount);
	}
	
	codeCreateArray(itemCount) {
		this.code2(OPCODE_CREATE_ARRAY, itemCount);
	}
	
	codeArrayTimes() {
		this.code1(OPCODE_ARRAY_TIMES);
	}
	
	codeBasicArrayTimes() {
		this.code1(OPCODE_BASIC_ARRAY_TIMES);
	}
	
	codeCreateString(strId) {
		this.code2(OPCODE_CREATE_STRING, strId);
	}
	
	codePopGlobal(offset) {
		this.code2(OPCODE_POP_GLOBAL, offset);
	}
	
	codePopLocal(offset) {
		this.code2(OPCODE_POP_LOCAL, offset);
	}
	
	codePopIndirect(offset) {
		this.code2(OPCODE_POP_INDIRECT, offset);
	}
	
	codePopPtrOffset() {
		this.code1(OPCODE_POP_PTR_OFFSET);
	}
		
	codePopVoid(count) {
		this.code2(OPCODE_POP_VOID, count);
	}
	
	codeAdd() {
		this.code1(OPCODE_ADD);
	}
	
	codeSub() {
		this.code1(OPCODE_SUB);
	}

	codeDiv() {
		this.code1(OPCODE_DIV);
	}

	codeRem() {
		this.code1(OPCODE_REM);
	}

	codeMul() {
		this.code1(OPCODE_MUL);
	}
	
	codeNeg() {
		this.code1(OPCODE_NEG);
	}
	
	codeGt() {
		this.code1(OPCODE_GT);
	}

	codeGte() {
		this.code1(OPCODE_GTE);
	}

	codeLt() {
		this.code1(OPCODE_LT);
	}

	codeLte() {
		this.code1(OPCODE_LTE);
	}
	
	codeEq() {
		this.code1(OPCODE_EQ);
	}
	
	codeNe() {
		this.code1(OPCODE_NE);
	}

	// real

	codeAddf() {
		this.code1(OPCODE_ADDF);
	}
	
	codeSubf() {
		this.code1(OPCODE_SUBF);
	}

	codeDivf() {
		this.code1(OPCODE_DIVF);
	}

	codeMulf() {
		this.code1(OPCODE_MULF);
	}
	
	codeNegf() {
		this.code1(OPCODE_NEGF);
	}
	
	codeGtf() {
		this.code1(OPCODE_GTF);
	}

	codeGtef() {
		this.code1(OPCODE_GTEF);
	}

	codeLtf() {
		this.code1(OPCODE_LTF);
	}

	codeLtef() {
		this.code1(OPCODE_LTEF);
	}
	
	codeEqf() {
		this.code1(OPCODE_EQF);
	}
	
	codeNef() {
		this.code1(OPCODE_NEF);
	}
	
	// real


	codeAnd() {
		this.code1(OPCODE_AND);
	}
	
	codeOr() {
		this.code1(OPCODE_OR);
	}
	
	codeNot() {
		this.code1(OPCODE_NOT);
	}
		
	codeNext() {
		this.code1(OPCODE_NEXT);
	}
	
	codeEnded() {
		this.code1(OPCODE_ENDED);
	}
	
	codeEqRef() {
		this.code1(OPCODE_EQ_REF);
	}
	
	codeJz(offset) {
		this.code2(OPCODE_JZ, offset);
		return this.codeSize - 1;
	}
	
	codeJnz(offset) {
		this.code2(OPCODE_JNZ, offset);
		return this.codeSize - 1;
	}
	
	codeJmp(offset) {
		this.code2(OPCODE_JMP, offset);
		return this.codeSize - 1;
	}
	
	codeRaise() {
		this.code1(OPCODE_RAISE);
	}
			
	codeRet() {
		this.code1(OPCODE_RET);
	}

	codeRetVal() {
		this.code1(OPCODE_RET_VAL);
	}
	
	codeYield() {
		this.code1(OPCODE_YIELD);
	}
	
	codeYieldDone() {
		this.code1(OPCODE_YIELD_DONE);
	}
	
	codeCall(ptr) {
		this.code2(OPCODE_CALL, ptr);
	}
		
	codeCallNative(ptr) {
		this.code2(OPCODE_CALL_NATIVE, ptr);
	}
	
	codeCallAbstract(methodIndex) {
		this.code2(OPCODE_CALL_ABSTRACT, methodIndex);
	}
	
	codeInitGenerator(ptr) {
		this.code2(OPCODE_INIT_GENERATOR, ptr);
	}
	
	codeCreateExceptionHandler(offset) {
		this.code2(OPCODE_CREATE_EXCEPTION_HANDLER, offset);
		return this.codeSize - 1;
	}
			
}


class CompilerContext {
	
	constructor() {
		this.globalScope = CompilerScope.makeGlobal();
		this.types = {
			"integer": EVAL_TYPE_INTEGER,
			"real": EVAL_TYPE_REAL,
			"boolean": EVAL_TYPE_BOOLEAN,
			"text": EVAL_TYPE_TEXT,
			"char": EVAL_TYPE_CHAR
		};
		this.functions = {};
		this.procedures = {};
		this.codeBlocks = [];
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
		let uniqueType = this.types[evalType.typeKey()];
		if (uniqueType === undefined) {
			this.types[evalType.typeKey()] = evalType;
			if (evalType.tag === "res-type-array") {
				var lengthFunc = new EvalResultFunction(
					"length",
					new EvalResultParameterList(1, [new EvalResultParameter("array", evalType, false)]),
					EVAL_TYPE_INTEGER, 
					false
				);
				if (evalType.underlyingType.isRef) {
					lengthFunc.nativeIndex = this.getFunction("length_array(ref)").nativeIndex;
				} else {
					lengthFunc.nativeIndex = this.getFunction("length_basic_array(ref)").nativeIndex;
				}
				this.addFunction(lengthFunc);
			}
			return evalType;
		}
		return uniqueType;
	}
	
	removeType(typeKey) {
		delete this.types[typeKey];		
	}
	
	addCodeBlock(blockName) {
		let i = this.codeBlocks.length;
		this.codeBlocks[i] = new CodeBlock(blockName);
		// console.log("Code block " + i + ": " + blockName);
		return i;
	}
			
}


class CompilerVariable {
	constructor(varName, varType, isCtx, isConst, isGlobal, isParameter, offset) {
		this.varName = varName;
		this.varType = varType;
		this.isCtx = isCtx;
		this.isConst = isConst;
		this.isGlobal = isGlobal;
		this.isParameter = isParameter;
		this.offset = offset;
	}
}


class CompilerScope {

	static makeGlobal() {
		return new CompilerScope(null, false, false, null);
	}
	
	static makeBlock(parent) {
		return new CompilerScope(parent, false, false, null);
	}
	
	static makeFunction(parent, isGenerator, returnType) {
		return new CompilerScope(parent, true, isGenerator, returnType);
	}
	
	static makeProcedure(parent) {
		return new CompilerScope(parent, true, false, null);
	}

	constructor(parent, isFrame, isGenerator, returnType) {
		this.parent = parent;
		this.isFrame = isFrame;
		this.isGenerator = isGenerator;
		this.returnType = returnType;
		this.isGlobal = parent === null || (this.parent.isGlobal && isFrame === false);
		this.variables = [];
		this.parameters = [];
		this.variableCount = 0;
		this.parameterCount = 0;
		this.offset = parent === null || isFrame ? 0 : (parent.offset + parent.variableCount);
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
	
	addParameter(varName, varType, isCtx, offset) {
		let newVar = new CompilerVariable(varName, varType, isCtx, false, false, true, offset);
		this.parameters[this.parameterCount] = newVar;
		this.parameterCount++;
		return newVar;	
	}


	addVariable(varName, varType, isConst) {
		let newVar = new CompilerVariable(varName, varType, false, isConst, this.isGlobal, false, this.offset + this.variableCount);
		this.variables[this.variableCount] = newVar;
		this.variableCount++;
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
	
	pushScopeFunction(isGenerator, returnType) {
		this.scope = CompilerScope.makeFunction(this.scope, isGenerator, returnType);
	}
	
	pushScopeProcedure() {
		this.scope = CompilerScope.makeProcedure(this.scope);
	}
	
	popScope() {
		this.scope = this.scope.parent;
	}
	
	evalType(expr) {
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
			return this.context.addType(new EvalTypeArray(underType));
		}
		if (expr.tag === "ast-type-sequence") {
			let underType = this.evalType(expr.underlyingType);
			if (underType.isError()) {
				return underType;
			}
			return this.context.addType(new EvalTypeSequence(underType));
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
				fields[i] = new EvalTypeRecordField(expr.fields[i].fieldName, fieldType);
			}
			return this.context.addType(new EvalTypeRecord(expr.fieldCount, fields));
		}
		if (expr.tag === "ast-type-variant") {
			for (let i = 1; i < expr.fieldCount; i++) {
				for (let j = 0; j < i; j++) {
					if (expr.fields[i].fieldName === expr.fields[j].fieldName) {
						return EvalError.fieldAlreadyExists(expr.fields[i].fieldName).fromExpr(expr.fields[i]);
					}
				}
			}
			let fields = [];
			for (let i = 0; i < expr.fieldCount; i++) {
				let fieldType = null;
				if (expr.fields[i].fieldType !== null) {
					fieldType = this.evalType(expr.fields[i].fieldType);
					if (fieldType.isError()) {
						return fieldType;
					}
				}
				fields[i] = new EvalTypeRecordField(expr.fields[i].fieldName, fieldType);
			}
			let variantType = new EvalTypeVariant(expr.fieldCount, fields);
			let existingType = this.context.getType(variantType.typeKey());
			if (existingType !== null) {
				return existingType;
			}
			this.context.addType(variantType);
			return variantType;
		}
		if (expr.tag === "ast-type-abstract") {
			let methods = [];
			for (let i = 0; i < expr.methodCount; i++) {
				let methodExpr = expr.methods[i];
				let paramListExpr = methodExpr.parameterList;
				let params = [];
				for (let j = 0; j < paramListExpr.parameterCount; j++) {
					let paramExpr = paramListExpr.parameters[j];
					let paramType = null;
					if (paramExpr.parameterType.tag === "ast-type-named" && paramExpr.parameterType.typeName === "self") {
						paramType = null;
					} else {
						paramType = this.evalType(paramExpr.parameterType);
						if (paramType.isError()) {
							return paramType;
						}
					}
					params[j] = new EvalTypeAbstractParam(paramExpr.parameterName, paramType);
				}
				let isFunction = false;
				let returnType = null;
				if (methodExpr.returnType !== null) {
					isFunction = true;
					if (methodExpr.returnType.tag  === "ast-type-named" && methodExpr.returnType.typeName === "self") {
						returnType = null;
					} else {
						returnType = this.evalType(methodExpr.returnType);
						if (returnType.isError()) {
							return returnType;
						}
					}
				}
				methods[i] = new EvalTypeAbstractMethod(isFunction, methodExpr.methodName, paramListExpr.parameterCount, params, returnType);
			}
			let abstractType = new EvalTypeAbstract(expr.methodCount, methods);
			{
				let uniqueType = this.context.getType(abstractType);
				if (uniqueType !== null) {
					return uniqueType;
				}
			}
			abstractType = this.context.addType(abstractType);
			//
			// create the abstract functions and procedure for the abstract type
			//
			for (let i = 0; i < abstractType.methodCount; i++) {
				let method = abstractType.methods[i];
				let params = [ new EvalResultParameter("self", abstractType, false) ];
				for (let j = 0; j < method.paramCount; j++) {
					params[j + 1] = new EvalResultParameter(
						method.params[j].paramName,
						method.params[j].paramType === null ? abstractType : method.params[j].paramType,
						false
					);
				}
				let paramList = new EvalResultParameterList(method.paramCount + 1, params);
				if (method.isFunction) {
					let retType = method.returnType === null ? abstractType : method.returnType;
					let evalFunc = new EvalResultFunction(method.methodName, paramList, retType, false);
					if (this.context.getFunction(evalFunc) !== null) {
						this.context.removeType(abstactType.typeKey());
						return EvalError.functionAlreadyExists(evalFunc.funcKey()).fromExpr(expr);					
					}
					this.context.addFunction(evalFunc);
					evalFunc.abstractIndex = i;
				} else {
					let evalProc = new EvalResultProcedure(method.methodName, paramList);
					if (this.context.getProcedure(evalProc) !== null) {
						this.context.removeType(abstactType.typeKey());
						return EvalError.procedureAlreadyExists(evalProc.procKey()).fromExpr(expr);					
					}
					this.context.addProcedure(evalProc);
					evalProc.abstractIndex = i;
				}
			}
			return abstractType;
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
			let namedType = new EvalTypeName(expr.typeName, underlyingType);
			this.context.addType(namedType);
			if (underlyingType.tag === "res-type-variant") {
				// generate builders for the variant kinds that returns the named type
				let variantType = underlyingType;
				for (let i = 0; i < variantType.fieldCount; i++) {
					let paramCount = 0;
					let params = [];
					if (variantType.fields[i].fieldType !== null) {
						paramCount = 1;
						params[0] = new EvalResultParameter("variant_kind", variantType.fields[i].fieldType, false);
					}
					let evalFunc = new EvalResultFunction(
						expr.typeName + "_" + variantType.fields[i].fieldName,
						new EvalResultParameterList(paramCount, params),
						null,
						false
					);
					if (this.context.getFunction(evalFunc) !== null) {
						this.context.removeType(namedType.typeKey());
						return EvalError.functionAlreadyExists(evalFunc.funcKey()).fromExpr(expr);
					}
				}
				for (let i = 0; i < variantType.fieldCount; i++) {
					let paramCount = 0;
					let params = [];
					if (variantType.fields[i].fieldType !== null) {
						paramCount = 1;
						params[0] = new EvalResultParameter("variant_kind", variantType.fields[i].fieldType, false);
					}
					let evalFunc = new EvalResultFunction(
						expr.typeName + "_" + variantType.fields[i].fieldName,
						new EvalResultParameterList(paramCount, params),
						namedType,
						false
					);
					this.context.addFunction(evalFunc);
					let codeBlockId = this.context.addCodeBlock(evalFunc.functionKey());
					let codeBlock = this.context.codeBlocks[codeBlockId];
					if (paramCount === 0) {
						codeBlock.codePush(0);
					} else {
						codeBlock.codePushLocal(-5);
					}
					codeBlock.codePush(i);
					codeBlock.codeCreateRecord(2);
					codeBlock.codeRetVal();
					evalFunc.codeBlockIndex = codeBlockId;
					variantType.fields[i].builder = evalFunc;
				}
			}
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-variable-declaration") {
			if (this.scope.getLocalVariable(expr.varName) !== null) {
				return EvalError.variableAlreadyExists(expr.varName).fromExpr(expr);
			}
			let initValueType = this.eval(expr.valueExpr);
			if (initValueType.isError()) {
				return initValueType;
			}
			this.scope.addVariable(expr.varName, initValueType, expr.isConst);
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
				let valueType = this.eval(expr.right);
				if (valueType.isError()) {
					return valueType;
				}
				if (valueType !== variable.varType) {
					return EvalError.wrongType(valueType, variable.varType.typeKey()).fromExpr(expr.right);					
				}
				// assign the value
				if (variable.isCtx) {
					this.codeBlock.codePopIndirect(variable.offset);
				} else if (variable.isGlobal) {
					this.codeBlock.codePopGlobal(variable.offset);
				} else {
					this.codeBlock.codePopLocal(variable.offset);
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
				while (indexedType.tag === "res-type-name") {
					indexedType = indexedType.underlyingType;
				}
				if (indexedType.tag !== "res-type-array") {
					return EvalError.wrongType(indexedType, "array").fromExpr(indexExpr.indexed);
				}
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
				// Evaluate the value to assign
				let valueType = this.eval(expr.right);
				if (valueType.isError()) {
					return valueType;
				}
				if (valueType !== indexedType.underlyingType) {
					return EvalError.wrongType(valueType, indexedType.underlyingType.typeKey()).fromExpr(expr.right);
				}
				// Assigne the value
				this.codeBlock.codePopPtrOffset();
				return EVAL_RESULT_OK;
			}
			if (expr.left.tag === "ast-field") {
				let fieldExpr = expr.left;
				// evaluate the record
				let recordType = this.evalForMutate(fieldExpr.expr);
				if (recordType.isError()) {
					return recordType;
				}
				while (recordType.tag === "res-type-name") {
					recordType = recordType.underlyingType;
				}
				if (recordType.tag != "res-type-record") {
					return EvalError.wrongType(recordType, "record").fromExpr(fieldExpr.expr);
				}
				// search and push the offset of the field
				let fieldIndex = -1;
				for (let i = 0; i < recordType.fieldCount; i++) {
					if (recordType.fields[i].fieldName === fieldExpr.fieldName) {
						fieldIndex = i;
						break;
					}
				}
				if (fieldIndex === -1) {
					return EvalError.unknownField(fieldExpr.fieldName, recordType.typeKey()).fromExpr(fieldExpr);
				}
				this.codeBlock.codePush(recordType.fields[fieldIndex].offset);
				// Evaluate the value to assign
				let valueType = this.eval(expr.right);
				if (valueType.isError()) {
					return valueType;
				}
				if (valueType !== recordType.fields[fieldIndex].fieldType) {
					return EvalError.wrongType(valueType, recordType.fields[fieldIndex].fieldType.typeKey()).fromExpr(expr.right);
				}
				// Assigne the value
				this.codeBlock.codePopPtrOffset();
				return EVAL_RESULT_OK;
			}
			return EvalError.unassignable(expr.left.tag).fromExpr(expr.left);
		}
		if (expr.tag == "ast-block") {
			let ret = EVAL_RESULT_OK;
			let exceptionLoc = -1;
			this.pushScopeBlock();
			if (expr.exception !== null) {
				exceptionLoc = this.codeBlock.codeCreateExceptionHandler(0);
				this.scope.addVariable("_exception_handler", EVAL_TYPE_REF, true);
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
				if (this.scope.variableCount > 0) {
					this.codeBlock.codePopVoid(this.scope.variableCount);
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
			let exRet = this.evalStatement(expr.exception);
			if (exRet.isError()) {
				return exRet;
			}
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
				this.codeBlock.codeEq();
				let nextLoc = this.codeBlock.codeJz(0);
				let stmtRes = this.evalStatement(whenStmt.statement);
				if (stmtRes.isError()) {
					return stmtRes;
				}
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
				this.codeBlock.codeRaise();
			} else {
				let stmtRes = this.evalStatement(expr.defaultStmt);
				if (stmtRes.isError()) {
					return stmtRes;
				}
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
				if (this.scope.variableCount > 0) {
					this.codeBlock.codePopVoid(this.scope.variableCount);
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
			let trueRet =  this.evalStatement(expr.trueStatement);
			if (trueRet.isError()) {
				return trueRet;
			}
			let endLoc = expr.falseStatement === null ? -1 : this.codeBlock.codeJmp(0);
			this.codeBlock.setLoc(falseLoc);
			if (expr.falseStatement === null) {
				return EVAL_RESULT_OK;
			}
			let falseRet = this.evalStatement(expr.falseStatement);
			if (falseRet.isError()) {
				return falseRet;
			}
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
			while (caseType.tag === "res-type-name") {
				caseType = caseType.underlyingType;
			}			
			if (caseType.tag !== "res-type-variant") {
				return EvalError.wrongType(caseType, "variant").fromExpr(expr.caseExpr);
			}
			let kindHasWhen = [];
			for (let i = 0; i < caseType.fieldCount; i++) {
				kindHasWhen[i] = false;
			}
			this.codeBlock.codeDup();
			this.codeBlock.codePush(1);
			this.codeBlock.codePushPtrOffset();
			let endLocs = [];
			let endLocCount = 0;
			for (let i = 0; i < expr.whenCount; i++) {
				this.codeBlock.codeDup();
				let fieldIndex = 0;
				while (fieldIndex < caseType.fieldCount) {
					if (caseType.fields[fieldIndex].fieldName === expr.whens[i].kindName) {
						break;
					}
					fieldIndex++;
				}
				if (fieldIndex === caseType.fieldCount) {
					return EvalError.unknownVariantKind(expr.whens[i].kindName).fromExpr(expr.whens[i]);
				}
				if (kindHasWhen[fieldIndex] === true) {
					return EvalError.variantKindAlreadyManaged(expr.whens[i].kindName).fromExpr(expr.whens[i]);
				}
				this.codeBlock.codePush(fieldIndex);
				this.codeBlock.codeEq();						
				let nextLoc = this.codeBlock.codeJz(0);
				this.codeBlock.codePopVoid(1);
				this.pushScopeBlock();
				this.codeBlock.codePush(0);
				this.codeBlock.codePushPtrOffset();
				this.scope.addVariable(expr.whens[i].varName, caseType.fields[fieldIndex].fieldType, false);
				let thenRet = this.evalStatement(expr.whens[i].thenBlock);
				if (thenRet.isError()) {
					return thenRet;
				}
				this.codeBlock.codePopVoid(1);
				this.popScope();
				endLocs[endLocCount] = this.codeBlock.codeJmp(0);
				endLocCount++;
				this.codeBlock.setLoc(nextLoc);
			}
			this.codeBlock.codePopVoid(2);
			if (expr.elseBlock !== null) {
				let elseRet = this.evalStatement(expr.elseBlock);
				if (elseRet.isError()) {
					return elseRet;
				}
			}
			for (let i = 0; i < endLocCount; i++) {
				this.codeBlock.setLoc(endLocs[i]);
			}
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-while") {
			let testLoc = this.codeBlock.codeSize;
			let conditionType = this.eval(expr.condition);
			if (conditionType.isError()) {
				return conditionType;
			}
			if (conditionType !== EVAL_TYPE_BOOLEAN) {
				return EvalError.wrongType(conditionType, "boolean").fromExpr(expr.condition);	
			}
			let endLoc = this.codeBlock.codeJz(0);
			let stmtRet = this.evalStatement(expr.statement);
			if (stmtRet.isError()) {
				return stmtRet;
			}
			this.codeBlock.codeJmp(testLoc);
			this.codeBlock.setLoc(endLoc);
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-for") {
			if (expr.sequence.tag === "ast-range") {
				this.pushScopeBlock();
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
				let stmtRet = this.evalStatement(expr.statement);
				if (stmtRet.isError()) {
					return stmtRet;
				}
				this.codeBlock.codePush(1);
				if (expr.isReverse) {
					this.codeBlock.codeSub();
				} else {
					this.codeBlock.codeAdd();
				}
				this.codeBlock.codeJmp(testLoc);
				this.codeBlock.setLoc(endLoc);
				this.codeBlock.codePopVoid(this.scope.variableCount);
				this.popScope();
				return EVAL_RESULT_OK;
			} else {
				this.pushScopeBlock();
				let sequence = this.eval(expr.sequence);
				if (sequence.isError()) {
					return sequence;
				}
				if (sequence.tag !== "res-type-sequence") {
					return EvalError.wrongType(sequence, "sequence").fromExpr(expr.sequence);
				}
				let sequenceVar = this.scope.addVariable("_for_sequence", sequence, false);
				this.codeBlock.codePushLocal(sequenceVar.offset);
				this.codeBlock.codeNext();
				let indexVar = this.scope.addVariable(expr.index, sequence.underlyingType, false);
				let testLoc = this.codeBlock.codeSize;
				this.codeBlock.codePushLocal(sequenceVar.offset);
				this.codeBlock.codeEnded();
				let endLoc = this.codeBlock.codeJnz(0);
				let stmtRet = this.evalStatement(expr.statement);
				if (stmtRet.isError()) {
					return stmtRet;
				}
				this.codeBlock.codePushLocal(sequenceVar.offset);
				this.codeBlock.codeNext();
				this.codeBlock.codePopLocal(indexVar.offset);
				this.codeBlock.codeJmp(testLoc);
				this.codeBlock.setLoc(endLoc);
				this.codeBlock.codePopVoid(this.scope.variableCount);
				this.popScope();
				return EVAL_RESULT_OK;
			}
			return EvalError.unknownType(expr.sequence.tag).fromExpr(expr.sequence);
		}
		if (expr.tag === "ast-raise") {
			let raiseType = this.eval(expr.expr);
			if (raiseType.isError()) {
				return raiseType;
			}
			if (raiseType !== EVAL_TYPE_INTEGER) {
				return EvalError.wrongType(raiseType, "integer").fromExpr(expr.expr);
			}
			this.codeBlock.codeRaise();
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
			if (retType !== frameScope.returnType) {
				return EvalError.wrongType(retType, frameScope.returnType.typeKey()).fromExpr(expr.expr);
			}
			if (retType === null) {
				this.codeBlock.codeRet();
			} else {
				this.codeBlock.codeRetVal();
			}
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
			this.codeBlock.codeYield();
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
				for (let i = 0; i < parameterList.parameterCount; i++) {
					if (evalFunc.isGenerator === true) {
						this.scope.addVariable(
							parameterList.parameters[i].parameterName,
							parameterList.parameters[i].parameterType,
							false
						);
					} else {
						this.scope.addParameter(
							parameterList.parameters[i].parameterName,
							parameterList.parameters[i].parameterType,
							parameterList.parameters[i].isCtx,
							i - parameterList.parameterCount - 4,
							false
						);
					}
				}
				let ret = this.evalStatement(expr.statement);
				if (ret.isError()) {
					this.context.removeFunction(evalFunc.functionKey());
					return ret;
				}
				if (evalFunc.isGenerator === true) {
					this.codeBlock.codeYieldDone();
				} else if (ret !== EVAL_RESULT_RETURN) {
					this.context.removeFunction(evalFunc.functionKey());
					return EvalError.noFunctionReturn(evalFunc.functionKey()).fromExpr(expr.statement);
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
						parameterList.parameters[i].parameterType,
						parameterList.parameters[i].isCtx,
						i - parameterList.parameterCount - 4
					);
				}
				let ret = this.evalStatement(expr.statement);
				if (ret.isError()) {
					this.context.removeProcedure(evalProc.procedureKey());
					return ret;
				}
				this.codeBlock.codeRet();
				this.popScope();
				this.codeBlock = oldCodeBlock;
			} // End Compile procedure
			return EVAL_RESULT_OK;
		}
		if (expr.tag === "ast-procedure") {
			let argTypes = [];
			for (let i = 0; i < expr.argList.argCount; i++) {
				let argType = this.eval(expr.argList.args[i]);
				if (argType.isError()) {
					return argType;
				}
				argTypes[i] = argType;
			}
			let procKey = expr.procedureName + "(";
			for (let i = 0; i < expr.argList.argCount; i++) {
				procKey += (i > 0 ? "," : "") + (expr.argList.args[i].tag === "ast-ctx-arg" ? "ctx " : "") + argTypes[i].typeKey();
			}
			procKey += ")";
			let proc = this.context.getProcedure(procKey);
			if (proc === null) {
				return EvalError.unknownProcedure(procKey).fromExpr(expr);
			}
			this.codeBlock.codePush(expr.argList.argCount);
			if (proc.nativeIndex !== -1) {
				this.codeBlock.codeCallNative(proc.nativeIndex);
			} else if (proc.codeBlockIndex !== -1) {
				this.codeBlock.codeCall(proc.codeBlockIndex);
			} else {
				this.codeBlock.codeCallAbstract(proc.abstractIndex);
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
			if (v.isCtx) {
				this.codeBlock.codePushIndirectForMutate(v.offset);
			} else if (v.isGlobal) {
				this.codeBlock.codePushGlobalForMutate(v.offset);
			} else {
				this.codeBlock.codePushLocalForMutate(v.offset);
			}
			return v.varType;
		}
		if (expr.tag === "ast-index") {
			// evaluate the array ref
			let indexedType = this.evalForMutate(expr.indexed);
			if (indexedType.isError()) {
				return indexedType;
			}
			while (indexedType.tag === "res-type-name") {
				indexedType = indexedType.underlyingType;
			}
			if (indexedType.tag !== "res-type-array") {
				return EvalError.wrongType(indexedType, "array").fromExpr(expr.indexed);
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
			this.codeBlock.codePushPtrOffsetForMutate();
			return indexedType.underlyingType;
		}
		if (expr.tag === "ast-field") {
			let recordType = this.evalForMutate(expr.expr);
			if (recordType.isError()) {
				return recordType;
			}
			while (recordType.tag === "res-type-name") {
				recordType = recordType.underlyingType;
			}
			if (recordType.tag != "res-type-record") {
				return EvalError.wrongType(recordType, "record").fromExpr(expr.expr);
			}
			for (let i = 0; i < recordType.fieldCount; i++) {
				if (recordType.fields[i].fieldName === expr.fieldName) {
					this.codeBlock.codePush(recordType.fields[i].offset);
					this.codeBlock.codePushPtrOffsetForMutate();
					return recordType.fields[i].fieldType;
				}
			}
			return EvalError.unknownField(expr.fieldName, recordType.typeKey()).fromExpr(expr);
		}
		return EvalError.unassignable(expr.tag).fromExpr(expr);
	}
	
	eval(expr) {
		if (expr.tag === "ast-as") {
			let asType = this.evalType(expr.exprType);
			if (asType.isError()) {
				return asType;
			}
			if (expr.expr.tag === "ast-value-array" && expr.expr.itemCount === 0) {
				// special case when the left expression is an empty array
				// we don't want to eval it, but directly create a basic array or array
				// depending on the as type
				let actAsType = asType;
				while (actAsType.tag === "res-type-name") {
					actAsType = actAsType.underlyingType;
				}
				if (actAsType.tag !== "res-type-array") {
					return EvalError.wrongType("empty array", asType.typeKey()).fromExpr(expr.expr);				
				}
				if (actAsType.underlyingType.isRef === true) {
					this.codeBlock.codeCreateArray(0);
				} else {
					this.codeBlock.codeCreateBasicArray(0);
				}
				return asType;
			}
			let valueType = this.eval(expr.expr);
			if (valueType.isError()) {
				return valueType;
			}
			if (valueType === asType) {
				return asType;
			}
			if (valueType.tag === "res-type-name" && asType === valueType.underlyingType) {
				return asType;
			}
			let actAsType = asType;
			while (actAsType.tag === "res-type-name") {
				actAsType = actAsType.underlyingType;
				if (valueType === actAsType) {
					return asType;
				}
			}
			if (actAsType.tag === "res-type-abstract") {
				for (let i = 0; i < actAsType.methodCount; i++) {
					let methodKey = actAsType.methods[i].methodKey(valueType, asType);
					if (actAsType.methods[i].isFunction) {
						let func = this.context.getFunction(methodKey);
						if (func === null) {
							return EvalError.unknownFunction(methodKey).fromExpr(expr.expr);
						}
						let retType = actAsType.methods[i].returnType;
						if (retType === null) {
							retType = asType;
						}
						if (retType !== func.returnType) {
							return EvalError.wrongType(func.returnType, retType.typeKey()).fromExpr(expr.valueExpr);
						}
						this.codeBlock.codePush(func.codeBlockIndex);
						this.codeBlock.codePush(func.nativeIndex);
					} else {
						let proc = this.context.getProcedure(methodKey);
						if (proc === null) {
							return EvalError.unknownProcedure(methodKey);
						}
						this.codeBlock.codePush(proc.codeBlockIndex);
						this.codeBlock.codePush(proc.nativeIndex);
					}
				}
				this.codeBlock.codeCreateRecord(1 + actAsType.methodCount * 2);
				return asType;
			}
			return EvalError.wrongType(valueType, asType.typeKey()).fromExpr(expr.expr);				
		}
		if (expr.tag === "ast-value-boolean") {
			this.codeBlock.codePush(expr.boolValue ? 1 : 0);
			return EVAL_TYPE_BOOLEAN;
		}
		if (expr.tag === "ast-value-integer") {
			this.codeBlock.codePush(expr.intValue);
			return EVAL_TYPE_INTEGER;
		}
		if (expr.tag === "ast-value-real") {
			this.codeBlock.codePush(expr.realValue);
			return EVAL_TYPE_REAL;
		}
		if (expr.tag === "ast-value-text") {
			let strId = this.codeBlock.addStrConst(expr.textValue);
			this.codeBlock.codeCreateString(strId);
			return EVAL_TYPE_TEXT;
		}
		if (expr.tag === "ast-value-array") {
			if (expr.itemCount === 0) {
				return EvalError.emptyArrayMustBeTyped().fromExpr(expr);
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
			if (itemType.isRef === false) {
				this.codeBlock.codeCreateBasicArray(expr.itemCount);
			} else {
				this.codeBlock.codeCreateArray(expr.itemCount);
			}
			return this.context.addType(new EvalTypeArray(itemType));
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
			this.codeBlock.codeCreateRecord(expr.fieldCount);
			return this.context.addType(new EvalTypeRecord(expr.fieldCount, fields));
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
			if (expr.operator === TOK_CONCAT) {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				if (leftType !== EVAL_TYPE_TEXT && leftType.tag !== "res-type-array") {
					return EvalError.wrongType(leftType, "text or array").fromExpr(expr.left);
				}
				let rightType = this.eval(expr.right);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType.typeKey() !== leftType.typeKey()) {
					return EvalError.wrongType(rightType, leftType.typeKey()).fromExpr(expr.right);
				}
				this.codeBlock.codePush(2);
				if (leftType === EVAL_TYPE_TEXT) {
					this.codeBlock.codeCallNative(this.context.getFunction("concat(text,text)").nativeIndex);
				} else if (leftType.underlyingType.isRef === false) {
					this.codeBlock.codeCallNative(this.context.getFunction("concat_basic_array(ref,ref)").nativeIndex)
				} else {
					this.codeBlock.codeCallNative(this.context.getFunction("concat_array(ref,ref)").nativeIndex);
				}
				return leftType;
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
				if (leftType.isRef) {
					this.codeBlock.codeArrayTimes();
				} else {
					this.codeBlock.codeBasicArrayTimes();
				}
				return this.context.addType(new EvalTypeArray(leftType));
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
			if (expr.operator === TOK_EQ || expr.operator === TOK_NE) {
				let leftType = this.eval(expr.left);
				if (leftType.isError()) {
					return leftType;
				}
				let rightType = this.eval(expr.right);
				if (rightType.isError()) {
					return rightType;
				}
				if (rightType !== leftType) {
					return EvalError.wrongType(rightType, leftType.typeKey()).fromExpr(expr.right);
				}
				if (rightType.isRef) {
					this.codeBlock.codeEqRef();
					if (expr.operator === TOK_NE) {
						this.codeBlock.codeNot();
					}
				} else if (rightType.isRef) {
					return EvalError.wrongType(rightType, "comparable type").fromExpr(expr.right);
				} else {
					if (leftType === EVAL_TYPE_REAL) {
						if (expr.operator === TOK_EQ) {
							this.codeBlock.codeEqf();
						} else {
							this.codeBlock.codeNef();
						}
					} else {
						if (expr.operator === TOK_EQ) {
							this.codeBlock.codeEq();
						} else {
							this.codeBlock.codeNe();
						}
					}
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
			if (v.isCtx) {
				this.codeBlock.codePushIndirect(v.offset);
			} else {
				if (v.isGlobal) {
					this.codeBlock.codePushGlobal(v.offset);
				} else {
					this.codeBlock.codePushLocal(v.offset);
				}
			}
			return v.varType;
		}
		if (expr.tag === "ast-index") {
			// evaluate the array ref
			let indexedType = this.eval(expr.indexed);
			if (indexedType.isError()) {
				return indexedType;
			}
			while (indexedType.tag === "res-type-name") {
				indexedType = indexedType.underlyingType;
			}
			if (indexedType.tag !== "res-type-array") {
				return EvalError.wrongType(indexedType, "array").fromExpr(expr.indexed);
			}
			// evaluate the index
			let indexType = this.eval(expr.index);
			if (indexType.isError()) {
				return indexType;
			}
			if (indexType !== EVAL_TYPE_INTEGER) {
				return EvalError.wrongType(indexType, "integer").fromExpr(expr.index);
			}
			if (expr.indexTo === null) {
				// push the result on the stack
				this.codeBlock.codePushPtrOffset();
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
			this.codeBlock.codePush(3);
			if (indexedType.underlyingType.isRef === false) {
				this.codeBlock.codeCallNative(this.context.getFunction("slice_basic_array(ref,integer,integer)").nativeIndex);
			} else {
				this.codeBlock.codeCallNative(this.context.getFunction("slice_array(ref,integer,integer)").nativeIndex);
			}
			return indexedType;
		}		
		if (expr.tag === "ast-field") {
			let recordType = this.eval(expr.expr);
			if (recordType.isError()) {
				return recordType;
			}
			while (recordType.tag === "res-type-name") {
				recordType = recordType.underlyingType;
			}
			if (recordType.tag != "res-type-record") {
				return EvalError.wrongType(recordType, "record").fromExpr(expr.expr);
			}
			for (let i = 0; i < recordType.fieldCount; i++) {
				if (recordType.fields[i].fieldName === expr.fieldName) {
					this.codeBlock.codePush(recordType.fields[i].offset);
					this.codeBlock.codePushPtrOffset();
					return recordType.fields[i].fieldType;
				}
			}
			return EvalError.unknownField(expr.fieldName, recordType.typeKey()).fromExpr(expr);
		}
		if (expr.tag === "ast-ctx-arg") {
			let v = this.scope.getVariable(expr.varName);
			if (v === null) {
				return EvalError.unknownVariable(expr.varName).fromExpr(expr);
			}
			if (v.isCtx) {
				this.codeBlock.codePushLocal(v.offset);
			} else {
				this.codeBlock.codePushIndirection(v.offset);
			}
			return v.varType;
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
			let funcKey = expr.functionName + "(";
			for (let i = 0; i < expr.argList.argCount; i++) {
				funcKey += (i > 0 ? "," : "") + (expr.argList.args[i].tag === "ast-ctx-arg" ? "ctx " : "") + argTypes[i].typeKey();
			}
			funcKey += ")";
			let func = this.context.getFunction(funcKey);
			if (func === null) {
				return EvalError.unknownFunction(funcKey).fromExpr(expr);
			}
			this.codeBlock.codePush(expr.argList.argCount);
			if (func.nativeIndex !== -1) {
				this.codeBlock.codeCallNative(func.nativeIndex);
			} else if (func.isGenerator === true) {
				this.codeBlock.codeInitGenerator(func.codeBlockIndex);
			} else if (func.codeBlockIndex !== -1) {
				this.codeBlock.codeCall(func.codeBlockIndex);
			} else {
				this.codeBlock.codeCallAbstract(func.abstractIndex);
			}
			return func.isGenerator ? this.context.addType(new EvalTypeSequence(func.returnType)) : func.returnType;
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
					this.codeBlock.codeDup();
					let whenType = this.eval(expr.whens[i].whenExpr);
					if (whenType.isError()) {
						return whenType;
					}
					if (whenType !== caseType) {
						return EvalError.wrongType(whenType, caseType.typeKey()).fromExpr(expr.whens[i].whenExpr);
					}
					if (caseType.isRef) {
						this.codeBlock.codeEqRef();
					} else {
						this.codeBlock.codeEq();
					}
					let nextLoc = this.codeBlock.codeJz(0);
					this.codeBlock.codePopVoid(1);
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
				this.codeBlock.codePopVoid(1);
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
			while (caseType.tag === "res-type-name") {
				caseType = caseType.underlyingType;
			}
			if (caseType.tag !== "res-type-variant") {
				return EvalError.wrongType(caseType, "variant").fromExpr(expr.caseExpr);
			}
			this.codeBlock.codeDup();
			this.codeBlock.codePush(1);
			this.codeBlock.codePushPtrOffset();
			let endLocs = [];
			let endLocCount = 0;
			let resultType = null;
			let kindHasWhen = [];
			for (let i = 0; i < caseType.fieldCount; i++) {
				kindHasWhen[i] = false;
			}
			for (let i = 0; i < expr.whenCount; i++) {
				this.codeBlock.codeDup();
				let fieldIndex = 0;
				while (fieldIndex < caseType.fieldCount) {
					if (caseType.fields[fieldIndex].fieldName === expr.whens[i].kindName) {
						break;
					}
					fieldIndex++;
				}
				if (fieldIndex === caseType.fieldCount) {
					return EvalError.unknownVariantKind(expr.whens[i].kindName).fromExpr(expr.whens[i]);
				}
				if (kindHasWhen[fieldIndex] === true) {
					return EvalError.variantKindAlreadyManaged(expr.whens[i].kindName).fromExpr(expr.whens[i]);
				}
				kindHasWhen[fieldIndex] = true;
				this.codeBlock.codePush(fieldIndex);
				this.codeBlock.codeEq();						
				let nextLoc = this.codeBlock.codeJz(0);
				this.codeBlock.codePopVoid(1);
				this.pushScopeBlock();
				this.codeBlock.codePush(0);
				this.codeBlock.codePushPtrOffset();
				this.scope.addVariable(expr.whens[i].varName, caseType.fields[fieldIndex].fieldType, true);
				let thenType = this.eval(expr.whens[i].thenExpr);
				if (thenType.isError()) {
					return thenType;
				}
				if (resultType === null) {
					resultType = thenType;
				} else if (thenType !== resultType) {
					return EvalError.wrongType(thenType, resultType.typeKey()).fromExpr(expr.whens[i].whenExpr);
				}
				this.codeBlock.codeSwap();
				this.codeBlock.codePopVoid(1);
				this.popScope();
				endLocs[endLocCount] = this.codeBlock.codeJmp(0);
				endLocCount++;
				this.codeBlock.setLoc(nextLoc);
			}
			this.codeBlock.codePopVoid(1);
			if (expr.elseExpr === null) {
				for (let i = 0; i < caseType.fieldCount; i++) {
					if (kindHasWhen[i] === false) {
						return EvalError.variantKindNotManaged(caseType.fields[i].fieldName).fromExpr(expr);
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
		return new EvalResultParameter(expr.parameterName, paramType, expr.isCtx);
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
const PLW_TAG_REF_RECORD = 2;
const PLW_TAG_REF_MAPPED_RECORD = 3;
const PLW_TAG_REF_STRING = 4;
const PLW_TAG_REF_BASIC_ARRAY = 5;
const PLW_TAG_REF_ARRAY = 6;

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

class PlwOffsetValue {
	constructor(val, isRef) {
		this.val = val;
		this.isRef = isRef
	}
}

class PlwAbstractRef {
	constructor(tag) {
		this.tag = tag;
		this.refCount = 1;
	}
	
	getOffsetValue(refMan, offset, isForMutate, refManError) {
		refManError.invalidRefTag(this.tag);
		return null;
	}
	
	setOffsetValue(refMan, offset, val, refManError) {
		refManError.invalidRefTag(this.tag);
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

class PlwRecordRef extends PlwAbstractRef {
	constructor(refSize, totalSize, ptr) {
		super(PLW_TAG_REF_RECORD);
		this.refSize = refSize;
		this.totalSize = totalSize;
		this.ptr = ptr;
	}
	
	static make(refMan, refSize, totalSize, ptr) {
		return refMan.addRef(new PlwRecordRef(refSize, totalSize, ptr));
	}
	
	getOffsetValue(refMan, offset, isForMutate, refManError) {
		if (offset < 0 || offset >= this.totalSize) {
			refManError.invalidRefOffset(offset);
			return null;
		}
		if (isForMutate === true) {
			this.ptr[offset] = refMan.makeMutable(this.ptr[offset], refManError);
			if (refManError.hasError()) {
				return null;
			}				
		}
		return new PlwOffsetValue(this.ptr[offset], offset < this.refSize);
	}
	
	setOffsetValue(refMan, offset, val, refManError) {
		if (offset < 0 || offset >= this.totalSize) {
			refManError.invalidRefOffset(offset);
			return;
		}
		if (offset < this.refSize) {
			refMan.decRefCount(this.ptr[offset], refManError);
			if (refManError.hasError()) {
				return;
			}
		}
		this.ptr[offset] = val;
	}
	
	shallowCopy(refMan, refManError) {
		let newPtr = [...this.ptr];
		for (let i = 0; i < this.refSize; i++) {
			refMan.incRefCount(newPtr[i], refManError);
			if (refManError.hasError()) {
				return -1;
			}
		}
		return PlwRecordRef.make(refMan, this.refSize, this.totalSize, newPtr);
	}
	
	compareTo(refMan, ref, refManError) {
		if (this.totalSize !== ref.totalSize || this.refSize !== ref.refSize) {
			return false;
		}
		for (let i = 0; i < this.totalSize; i++) {
			if (i < this.refSize) {
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
		for (let i = 0; i < this.refSize; i++) {
			refMan.decRefCount(this.ptr[i], refManError);
			if (refManError.hasError()) {
				return;
			}
		}
		this.ptr = null
	}
	
}

class PlwBasicArrayRef extends PlwAbstractRef {
	constructor(arraySize, ptr) {
		super(PLW_TAG_REF_BASIC_ARRAY);
		this.arraySize = arraySize;
		this.ptr = ptr;
	}
	
	static make(refMan, arraySize, ptr) {
		return refMan.addRef(new PlwBasicArrayRef(arraySize, ptr));
	}
	
	getOffsetValue(refMan, offset, isForMutate, refManError) {
		if (offset < 0 || offset >= this.arraySize) {
			refManError.invalidRefOffset(offset);
			return null;
		}
		return new PlwOffsetValue(this.ptr[offset], false);
	}
	
	setOffsetValue(refMan, offset, val, refManError) {
		if (offset < 0 || offset >= this.arraySize) {
			refManError.invalidRefOffset(offset);
			return;
		}
		this.ptr[offset] = val;
	}
	
	shallowCopy(refMan, refManError) {
		return PlwBasicArrayRef.make(refMan, this.arraySize, [...this.ptr]);
	}
	
	compareTo(refMan, ref, refManError) {
		if (this.arraySize !== ref.arraySize) {
			return false;
		}
		for (let i = 0; i < this.arraySize; i++) {
			if (this.ptr[i] !== ref.ptr[i]) {
				return false;
			}
		}
		return true;
	}
	
	destroy(refMan, refManError) {
		this.ptr = null;
	}

}

class PlwArrayRef extends PlwAbstractRef {
	constructor(arraySize, ptr) {
		super(PLW_TAG_REF_ARRAY);
		this.arraySize = arraySize;
		this.ptr = ptr;
	}
	
	static make(refMan, arraySize, ptr) {
		return refMan.addRef(new PlwArrayRef(arraySize, ptr));
	}
	
	getOffsetValue(refMan, offset, isForMutate, refManError) {
		if (offset < 0 || offset >= this.arraySize) {
			refManError.invalidRefOffset(offset);
			return null;
		}
		if (isForMutate === true) {
			this.ptr[offset] = refMan.makeMutable(this.ptr[offset], refManError);
			if (refManError.hasError()) {
				return null;
			}				
		}
		return new PlwOffsetValue(this.ptr[offset], true);
	}
	
	setOffsetValue(refMan, offset, val, refManError) {
		if (offset < 0 || offset >= this.arraySize) {
			refManError.invalidRefOffset(offset);
			return;
		}
		refMan.decRefCount(this.ptr[offset], refManError);
		if (refManError.hasError()) {
			return;
		}
		this.ptr[offset] = val;
	}
	
	shallowCopy(refMan, refManError) {
		let newPtr = [...this.ptr];
		for (let i = 0; i < this.arraySize; i++) {
			refMan.incRefCount(newPtr[i], refManError);
			if (refManError.hasError()) {
				return -1;
			}
		}
		return PlwArrayRef.make(refMan, this.arraySize, newPtr);
	}
	
	compareTo(refMan, ref, refManError) {
		if (this.arraySize !== ref.arraySize) {
			return false;
		}
		for (let i = 0; i < this.arraySize; i++) {
			if (!refMan.compareRefs(this.ptr[i], ref.ptr[i], refManError)) {
				return false;
			}
			if (refManError.hasError()) {
				return false;
			}
		}
		return true;
	}

	destroy(refMan, refManError) {
		for (let i = 0; i < this.arraySize; i++) {
			refMan.decRefCount(this.ptr[i], refManError);
			if (refManError.hasError()) {
				return;
			}
		}
		this.ptr = null
	}

}

class PlwMappedRecordRef extends PlwAbstractRef {
	constructor(totalSize, ptr, mapPtr) {
		super(PLW_TAG_REF_MAPPED_RECORD);
		this.totalSize = totalSize;
		this.ptr = ptr;
		this.mapPtr = mapPtr;
	}
	
	static make(refMan, totalSize, ptr, mapPtr) {
		return refMan.addRef(new PlwMappedRecordRef(totalSize, ptr, mapPtr));
	}
	
	resizeFrame(newSize) {
		for (let i = this.totalSize; i < newSize; i++) {
			this.ptr[i] = 0;
			this.mapPtr[i] = false;
		}
		this.totalSize = newSize;
	}
	
	destroy(refMan, refManError) {
		for (let i = this.totalSize - 1; i >= 0; i--) {
			if (this.mapPtr[i] === true) {
				refMan.decRefCount(this.ptr[i], refManError);
				if (refManError.hasError()) {
					return;
				}
			}
		}
		this.ptr = null;
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


class PlwRefManager {

	constructor() {
		this.refs = [];
		this.refCount = 0;
		this.freeRefIds = [];
		this.freeRefIdCount = 0;
	}
	
	isValidRefId(refId) {
		return refId >= 0 && refId < this.refCount && this.refs[refId] !== -1;
	}
	
	getRef(refId, refManError) {
		if (!this.isValidRefId(refId)) {
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
		if (!this.isValidRefId(refId)) {
			refManError.invalidRefId(refId);
			return;	
		}
		this.refs[refId].refCount++;
	}
	
	addRefCount(refId, count, refManError) {
		if (!this.isValidRefId(refId)) {
			refManError.invalidRefId(refId);
			return;	
		}
		this.refs[refId].refCount += count;
	}
	
	decRefCount(refId, refManError) {
		if (!this.isValidRefId(refId)) {
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
			this.refs[refId] = -1;
			this.freeRefIds[this.freeRefIdCount] = refId;
			this.freeRefIdCount++;
		}
	}
	
	compareRefs(refId1, refId2, refManError) {
		if (!this.isValidRefId(refId1)) {
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
		if (!this.isValidRefId(refId)) {
			refManError.invalidRefId(refId);
			return false;
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
	
	setOffsetValue(refId, offset, val, refManError) {
		let ref = this.getRef(refId, refManError);
		if (refManError.hasError()) {
			return;
		}
		ref.setOffsetValue(this, offset, val, refManError);
	}
	
	getOffsetValue(refId, offset, isForMutate, refManError) {
		let ref = this.getRef(refId, refManError);
		if (refManError.hasError()) {
			return null;
		}
		return ref.getOffsetValue(this, offset, isForMutate, refManError);
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
		
	Frame Object
		codeBlockId
		ip
		arg1
		argN
		local1
		...
		localN

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

class StackMachine {

	constructor() {
		this.stackMap = [];
		this.stack = [];
		this.sp = 0;
		this.bp = 0;
		this.ip = 0;
		this.codeBlockId = -1;
		this.codeBlocks = null;
		this.natives = null;
		this.refMan = new PlwRefManager();
	}
	
	popResult() {
		this.sp--;
		return this.stack[this.sp];
	}
	
	raiseError(errorCode, refManError) {
		while (this.sp > 0) {
			if (this.stackMap[this.sp - 1] === true) {
				let refId = this.stack[this.sp - 1];
				let ref = this.refMan.getRef(refId, refManError);
				if (refManError.hasError()) {
					return false;
				}
				if (ref.tag === PLW_TAG_REF_EXCEPTION_HANDLER) {
					this.bp = ref.bp;
					this.ip = ref.ip;
					this.codeBlockId = ref.codeBlockId;
					this.refMan.decRefCount(refId, refManError);
					if (refManError.hasError()) {
						return false;
					}
					this.stack[this.sp - 1] = errorCode;
					this.stackMap[this.sp - 1] = false;
					return true;
				}
				this.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return false;
				}
			}
			this.sp--;
		}
		return false;
	}
	
	execute(codeBlock, codeBlocks, natives) {
		this.codeBlocks = [...codeBlocks, codeBlock];
		this.natives = natives;
		this.ip = 0;
		this.codeBlockId = this.codeBlocks.length - 1;
		return this.runLoop();
	}
	
	opcodeSwap() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let tmp = this.stack[this.sp - 2];
		let tmpMap = this.stackMap[this.sp - 2];
		this.stack[this.sp - 2] = this.stack[this.sp - 1];
		this.stackMap[this.sp - 2] = this.stackMap[this.sp - 1];
		this.stack[this.sp - 1] = tmp;
		this.stackMap[this.sp - 1] = tmpMap;
		return null;
	}
	
	opcodeDiv() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let divisor = this.stack[this.sp - 1];
		if (divisor === 0) {
			let refManError = new PlwRefManagerError();
			if (!this.raiseError(0, refManError)) {
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
				}
				return StackMachineError.divByZero().fromCode(this.codeBlockId, this.ip);
			}
		} else {
			this.stack[this.sp - 2] = Math.trunc(this.stack[this.sp - 2] / divisor);
			this.sp--;
		}
		return null;
	}
	
	opcodeRem() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let divisor = this.stack[this.sp - 1];
		if (divisor === 0) {
			return StackMachineError.divByZero().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = this.stack[this.sp - 2] % divisor;
		this.sp--;
		return null;
	}
	
	opcodePushPtrOffset(isForMutate) {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let refId = this.stack[this.sp - 2];
		let offset = this.stack[this.sp - 1];
		let refManError = new PlwRefManagerError();
		let offsetVal = this.refMan.getOffsetValue(refId, offset, isForMutate, refManError);
		if (refManError.hasError()) {
			return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = offsetVal.val;
		this.stackMap[this.sp - 2] = offsetVal.isRef;
		if (offsetVal.isRef === true) {
			this.refMan.incRefCount(this.stack[this.sp - 2], refManError);
			if (refManError.hasError()) {
				return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
			}
		}
		this.sp--;
		this.refMan.decRefCount(refId, refManError);
		if (refManError.hasError()) {
			return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
		}
		return null;
	}
	
	opcodeEqRef() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let refManError = new PlwRefManagerError();
		let result = this.refMan.compareRefs(this.stack[this.sp - 2], this.stack[this.sp - 1], refManError);
		if (refManError.hasError()) {
			return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.refMan.decRefCount(this.stack[this.sp - 2], refManError);
		if (!refManError.hasError()) {
			this.refMan.decRefCount(this.stack[this.sp - 1], refManError);
		}
		if (refManError.hasError()) {
			return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = result ? 1 : 0;
		this.sp--;
		return null;
	}
	
	opcodePopPtrOffset() {
		if (this.sp < 3) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}				
		let refId = this.stack[this.sp - 3];
		let offset = this.stack[this.sp - 2];
		let val = this.stack[this.sp - 1];
		let refManError = new PlwRefManagerError();
		this.refMan.setOffsetValue(refId, offset, val, refManError);
		if (refManError.hasError()) {
			return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.sp -= 3;
		this.refMan.decRefCount(refId, refManError);
		if (refManError.hasError()) {
			return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
		}
		return null;
	}
	
	opcodeRaise() {
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let errorCode = this.stack[this.sp - 1];
		let refManError = new PlwRefManagerError();
		if(!this.raiseError(errorCode, refManError)) {
			if (refManError.hasError()) {
				return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
			}
			return StackMachineError.exception(errorCode).fromCode(this.codeBlockId, this.ip);					
		}
		return null;
	}
	
	opcodeRetVal() {
		if (this.bp < 4 || this.bp > this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let retVal = this.stack[this.sp - 1];
		let retValIsRef = this.stackMap[this.sp - 1];
		let previousBp = this.stack[this.bp - 1];
		let previousIp = this.stack[this.bp - 2];
		let previousCodeBlockId = this.stack[this.bp - 3];
		let argCount = this.stack[this.bp - 4];
		if (this.bp < 4 + argCount) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let refManError = new PlwRefManagerError();
		for (let i = this.sp - 2; i >= this.bp - 4 - argCount; i--) {
			if (this.stackMap[i] === true) {
				this.refMan.decRefCount(this.stack[i], refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
				}
			}
		}
		this.sp = this.bp - 3 - argCount;
		this.stack[this.sp - 1] = retVal;
		this.stackMap[this.sp - 1] = retValIsRef;
		this.bp = previousBp;
		this.codeBlockId = previousCodeBlockId;
		this.ip = previousIp;
		return null;
	}
	
	opcodeRet() {
		if (this.bp < 4 || this.bp > this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let previousBp = this.stack[this.bp - 1];
		let previousIp = this.stack[this.bp - 2];
		let previousCodeBlockId = this.stack[this.bp - 3];
		let argCount = this.stack[this.bp - 4];
		if (this.bp < 4 + argCount) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let refManError = new PlwRefManagerError();
		for (let i = this.sp - 1; i >= this.bp - 4 - argCount; i--) {
			if (this.stackMap[i] === true) {
				this.refMan.decRefCount(this.stack[i], refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
				}
			}
		}
		this.sp = this.bp - 4 - argCount;
		this.bp = previousBp;
		this.codeBlockId = previousCodeBlockId;
		this.ip = previousIp;
		return null;
	}
	
	opcodeYield() {
		if (this.bp < 4 || this.bp >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let refId = this.stack[this.bp - 4];
		let refManError = new PlwRefManagerError();
		let ref = this.refMan.getRefOfType(refId, PLW_TAG_REF_MAPPED_RECORD, refManError);
		if (refManError.hasError()) {
			return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
		}
		ref.resizeFrame(1 + (this.sp - this.bp));
		ref.ptr[1] = this.ip;
		for (let i = 0; i < this.sp - this.bp - 1; i++) {
			ref.ptr[i + 2] = this.stack[this.bp + i];
			ref.mapPtr[i + 2] = this.stackMap[this.bp + i];
		}
		let retVal = this.stack[this.sp - 1];
		let retValIsRef = this.stackMap[this.sp - 1];
		let previousBp = this.stack[this.bp - 1];
		let previousIp = this.stack[this.bp - 2];
		let previousCodeBlockId = this.stack[this.bp - 3];
		this.sp = this.bp - 3;
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 1] = retVal;
		this.stackMap[this.sp - 1] = retValIsRef;
		this.bp = previousBp;
		this.codeBlockId = previousCodeBlockId;
		this.ip = previousIp;
		this.refMan.decRefCount(refId, refManError);		
		if (refManError.hasError()) {
			return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
		}
		return null;
	}
	
	opcodeYieldDone() {
		if (this.bp < 4 || this.bp > this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let refId = this.stack[this.bp - 4];
		let refManError = new PlwRefManagerError();
		let ref = this.refMan.getRefOfType(refId, PLW_TAG_REF_MAPPED_RECORD, refManError);
		if (refManError.hasError()) {
			return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
		}
		ref.resizeFrame(2);
		ref.ptr[1] = this.ip;
		let previousBp = this.stack[this.bp - 1];
		let previousIp = this.stack[this.bp - 2];
		let previousCodeBlockId = this.stack[this.bp - 3];
		for (let i = this.sp - 1; i >= this.bp - 4; i --) {
			if (this.stackMap[i] === true) {
				this.refMan.decRefCount(this.stack[i], refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
				}
			}
		}
		this.sp = this.bp - 3;
		this.stack[this.sp - 1] = 0;
		this.stackMap[this.sp - 1] = false;
		this.bp = previousBp;
		this.codeBlockId = previousCodeBlockId;
		this.ip = previousIp;
		return null;
	}
	
	opcodeNext() {
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let refId = this.stack[this.sp - 1];
		let refManError = new PlwRefManagerError();
		let ref = this.refMan.getRefOfType(refId, PLW_TAG_REF_MAPPED_RECORD, refManError);
		if (refManError.hasError()) {
			return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp] = this.codeBlockId;
		this.stackMap[this.sp] = false;
		this.sp++;
		this.stack[this.sp] = this.ip;
		this.stackMap[this.sp] = false;
		this.sp++;
		this.stack[this.sp] = this.bp;
		this.stackMap[this.sp] = false;
		this.sp++;
		this.bp = this.sp;
		for (let i = 0; i < ref.totalSize - 2; i++) {
			this.stack[this.sp] = ref.ptr[i + 2];
			this.stackMap[this.sp] = ref.mapPtr[i + 2];
			ref.mapPtr[i + 2] = false;
			this.sp++;
		}
		this.codeBlockId = ref.ptr[0];
		this.ip = ref.ptr[1];
		return null;
	}
	
	opcodeEnded() {
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let refId = this.stack[this.sp - 1];
		let refManError = new PlwRefManagerError();
		let ref = this.refMan.getRefOfType(refId, PLW_TAG_REF_MAPPED_RECORD, refManError);
		if (refManError.hasError()) {
			return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
		}
		let ended = ref.ptr[1] >= this.codeBlocks[ref.ptr[0]].codeSize ? 1 : 0;
		this.refMan.decRefCount(this.stack[this.sp - 1], refManError);
		if (refManError.hasError()) {
			return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 1] = ended;
		return null;
	}
	
	opcodeBasicArrayTimes() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let val = this.stack[this.sp - 2];
		let count = this.stack[this.sp - 1];
		if (count < 0) {
			count = 0;
		}
		let ptr = new Array(count).fill(val);
		let refId = PlwBasicArrayRef.make(this.refMan, count, ptr);
		this.stack[this.sp - 2] = refId;
		this.stackMap[this.sp - 2] = true;
		this.sp--;
		return null;
	}
	
	opcodeArrayTimes() {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let val = this.stack[this.sp - 2];
		let count = this.stack[this.sp - 1];
		if (count < 0) {
			count = 0;
		}
		let ptr = new Array(count).fill(val);
		let refId = PlwArrayRef.make(this.refMan, count, ptr);
		let refManError = new PlwRefManagerError();
		if (count === 0) {
			this.refMan.decRefCount(val, refManError);
		} else {
			this.refMan.addRefCount(val, count - 1, refManError);
		}
		if (refManError.hasError()) {
			return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = refId;
		this.stackMap[this.sp - 2] = true;
		this.sp--;
		return null;
	}
	
	opcode1(code) {
		switch(code) {
		case OPCODE_DEBUG:
			console.log(this);
			return null;
		case OPCODE_DUP:
			if (this.sp < 1) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp] = this.stack[this.sp - 1];
			this.stackMap[this.sp] = this.stackMap[this.sp - 1];
			if (this.stackMap[this.sp]) {
				this.refMan.incRefCount(this.stack[this.sp]);
			}
			this.sp++;
			return null;
		case OPCODE_SWAP:
			return this.opcodeSwap();
		case OPCODE_ADD:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] += this.stack[this.sp - 1];
			this.sp--;
			return null;
		case OPCODE_ADDF:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] += this.stack[this.sp - 1];
			this.sp--;
			return null;
		case OPCODE_SUB:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] -= this.stack[this.sp - 1];
			this.sp--;
			return null;
		case OPCODE_SUBF:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] -= this.stack[this.sp - 1];
			this.sp--;
			return null;
		case OPCODE_DIV:
			return this.opcodeDiv();
		case OPCODE_DIVF:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] /= this.stack[this.sp - 1];
			this.sp--;
			return null;
		case OPCODE_REM:
			return this.opcodeRem();
		case OPCODE_MUL:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] *= this.stack[this.sp - 1];
			this.sp--;
			return null;
		case OPCODE_MULF:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] *= this.stack[this.sp - 1];
			this.sp--;
			return null;
		case OPCODE_NEG:
			if (this.sp < 1) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 1] = -this.stack[this.sp - 1]; 
			return null;
		case OPCODE_NEGF:
			if (this.sp < 1) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 1] = -this.stack[this.sp - 1]; 
			return null;
		case OPCODE_GT:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] = (this.stack[this.sp - 2] > this.stack[this.sp - 1]) ? 1 : 0;
			this.sp--;
			return null;
		case OPCODE_GTF:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] = (this.stack[this.sp - 2] > this.stack[this.sp - 1]) ? 1 : 0;
			this.sp--;
			return null;
		case OPCODE_LT:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] = (this.stack[this.sp - 2] < this.stack[this.sp - 1]) ? 1 : 0;
			this.sp--;
			return null;
		case OPCODE_LTF:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] = (this.stack[this.sp - 2] < this.stack[this.sp - 1]) ? 1 : 0;
			this.sp--;
			return null;
		case OPCODE_GTE:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] = (this.stack[this.sp - 2] >= this.stack[this.sp - 1]) ? 1 : 0;
			this.sp--;
			return null;
		case OPCODE_GTEF:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] = (this.stack[this.sp - 2] >= this.stack[this.sp - 1]) ? 1 : 0;
			this.sp--;
			return null;
		case OPCODE_LTE:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] = (this.stack[this.sp - 2] <= this.stack[this.sp - 1]) ? 1 : 0;
			this.sp--;
			return null;
		case OPCODE_LTEF:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] = (this.stack[this.sp - 2] <= this.stack[this.sp - 1]) ? 1 : 0;
			this.sp--;
			return null;
		case OPCODE_AND:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] = ((this.stack[this.sp - 2] !== 0) && (this.stack[this.sp - 1] !== 0)) ? 1 : 0;
			this.sp--;
			return null;
		case OPCODE_OR:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] = ((this.stack[this.sp - 2] !== 0) || (this.stack[this.sp - 1] !== 0)) ? 1 : 0;
			this.sp--;
			return null;
		case OPCODE_NOT:
			if (this.sp < 1) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 1] = this.stack[this.sp - 1] === 0 ? 1 : 0;
			return null;
		case OPCODE_EQ:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] = (this.stack[this.sp - 2] === this.stack[this.sp - 1]) ? 1 : 0;
			this.sp--;
			return null;
		case OPCODE_EQF:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] = (this.stack[this.sp - 2] === this.stack[this.sp - 1]) ? 1 : 0;
			this.sp--;
			return null;
		case OPCODE_EQ_REF:
			return this.opcodeEqRef();
		case OPCODE_NE:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] = (this.stack[this.sp - 2] !== this.stack[this.sp - 1]) ? 1 : 0;
			this.sp--;
			return null;
		case OPCODE_NEF:
			if (this.sp < 2) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp - 2] = (this.stack[this.sp - 2] !== this.stack[this.sp - 1]) ? 1 : 0;
			this.sp--;
			return null;
		case OPCODE_PUSH_PTR_OFFSET:
		case OPCODE_PUSH_PTR_OFFSET_FOR_MUTATE:
			return this.opcodePushPtrOffset(code === OPCODE_PUSH_PTR_OFFSET_FOR_MUTATE);
		case OPCODE_POP_PTR_OFFSET:
			return this.opcodePopPtrOffset();
		case OPCODE_RAISE:
			return this.opcodeRaise();
		case OPCODE_RET_VAL:
			return this.opcodeRetVal();
		case OPCODE_RET:
			return this.opcodeRet();
		case OPCODE_YIELD:
			return this.opcodeYield();
		case OPCODE_YIELD_DONE:
			return this.opcodeYieldDone();
		case OPCODE_NEXT:
			return this.opcodeNext();
		case OPCODE_ENDED:
			return this.opcodeEnded();
		case OPCODE_BASIC_ARRAY_TIMES:
			return this.opcodeBasicArrayTimes();
		case OPCODE_ARRAY_TIMES:
			return this.opcodeArrayTimes();
		default:
			return StackMachineError.unknownOp().fromCode(this.codeBlockId, this.ip);
		}	
	}
	
	opcodePopVoid(cellCount) {
		if (cellCount < 0 || cellCount > this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let refManError = new PlwRefManagerError();
		for (let i = this.sp - 1; i >= this.sp - cellCount; i--) {
			if (this.stackMap[i] === true) {
				this.refMan.decRefCount(this.stack[i], refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
				}
			}
		}
		this.sp -= cellCount;
		return null;
	}
	
	opcodeCreateString(strId) {
		if (strId < 0 || strId >= this.codeBlocks[this.codeBlockId].strConsts.length) {
			return StackMachineError.constAccessOutOfBound().fromCode(this.codeBlockId, this.ip);						
		}
		let str = this.codeBlocks[this.codeBlockId].strConsts[strId];
		this.stack[this.sp] = PlwStringRef.make(this.refMan, str);
		this.stackMap[this.sp] = true;
		this.sp++;
		return null;
	}
	
	opcodeCreateRecord(cellCount) {
		if (cellCount < 0 || cellCount > this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let ptr = new Array(cellCount);
		let offset = 0;
		for (let i = 0; i < cellCount; i++) {
			if (this.stackMap[this.sp - cellCount + i] === true) {
				ptr[offset] = this.stack[this.sp - cellCount + i];
				offset++;
			}
		}
		let refSize = offset;
		if (refSize !== cellCount) {
			for (let i = 0; i < cellCount; i++) {
				if (this.stackMap[this.sp - cellCount + i] !== true) {
					ptr[offset] = this.stack[this.sp - cellCount + i];
					offset++;
				}
			}
		}
		let refId = PlwRecordRef.make(this.refMan, refSize, cellCount, ptr);
		this.sp = this.sp - cellCount + 1;
		this.stack[this.sp - 1] = refId; 
		this.stackMap[this.sp - 1] = true;
		return null;
	}

	opcodeCreateBasicArray(cellCount) {
		if (cellCount < 0 || cellCount > this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let ptr = this.stack.slice(this.sp - cellCount, this.sp);
		let refId = PlwBasicArrayRef.make(this.refMan, cellCount, ptr);
		this.sp = this.sp - cellCount + 1;
		this.stack[this.sp - 1] = refId; 
		this.stackMap[this.sp - 1] = true;
		return null;
	}
	
	opcodeCreateArray(cellCount) {
		if (cellCount < 0 || cellCount > this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let ptr = this.stack.slice(this.sp - cellCount, this.sp);
		let refId = PlwArrayRef.make(this.refMan, cellCount, ptr);
		this.sp = this.sp - cellCount + 1;
		this.stack[this.sp - 1] = refId; 
		this.stackMap[this.sp - 1] = true;
		return null;
	}
	
	opcodeCallAbstract(funcId) {
		if (this.sp < 2) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let refId = this.stack[this.sp - 2];
		let refManError = new PlwRefManagerError();
		let ref = this.refMan.getRefOfType(refId, PLW_TAG_REF_RECORD, refManError);
		if (refManError.hasError()) {
			return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
		}
		if (funcId < 0 || ref.totalSize < 1 + 2 * funcId) {
			return StackMachineError.refAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let codeBlockId = ref.ptr[1 + 2 * funcId];
		if (codeBlockId < 0 || codeBlockId > this.codeBlocks.length) {
			return StackMachineError.codeAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let concreteIsRef = false;
		if (ref.refSize > 0) {
			concreteIsRef = true;
			this.refMan.incRefCount(ref.ptr[0], refManError);
			if (refManError.hasError()) {
				return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
			}
		}
		let concreteVal = ref.ptr[0];
		this.refMan.decRefCount(refId, refManError);
		if (refManError.hasError()) {
			return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
		}
		this.stack[this.sp - 2] = concreteVal;
		this.stackMap[this.sp - 2] = concreteIsRef;
		this.stack[this.sp] = this.codeBlockId;
		this.stackMap[this.sp] = false;
		this.sp++;
		this.stack[this.sp] = this.ip;
		this.stackMap[this.sp] = false;
		this.sp++;					
		this.stack[this.sp] = this.bp;
		this.stackMap[this.sp] = false;
		this.sp++;
		this.bp = this.sp;
		this.codeBlockId = codeBlockId;
		this.ip = 0;
		return null;
	}
	
	opcodeCallNative(nativeId) {
		if (nativeId < 0 || nativeId >= this.natives.length) {
			return StackMachineError.codeAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let argCount = this.stack[this.sp - 1];
		if (this.sp < 1 + argCount) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let error = this.natives[nativeId](this);
		if (error !== null) {
			console.log("error from native function " + nativeId);
			return error.fromCode(this.codeBlockId, this.ip);
		}
		return null;
	}
	
	opcodeInitGenerator(codeBlockId) {
		// stack is:
		//   arg1              sp - nbParam - 1
		//   ...
		//   argN
		//   nbParam           sp - 1
		if (this.sp < 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let nbParam = this.stack[this.sp - 1];
		if (this.sp < 1) {
			return StackMachineError.codeAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		if (nbParam < 0 || this.sp < nbParam + 1) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}					
		let ptr = new Array(nbParam + 2);
		let mapPtr = new Array(nbParam + 2);
		ptr[0] = codeBlockId;
		ptr[1] = 0;
		for (let i = 0; i < nbParam; i++) {
			ptr[i + 2] = this.stack[this.sp - nbParam - 1 + i];
			mapPtr[i + 2] = this.stackMap[this.sp - nbParam - 1 + i];
		}
		let refId = PlwMappedRecordRef.make(this.refMan, nbParam + 2, ptr, mapPtr);
		this.stack[this.sp - nbParam - 1] = refId;
		this.stackMap[this.sp - nbParam - 1] = true;
		this.sp -= nbParam;
		return null;
	}
	
	opcodePushGlobal(offset, isForMutate) {
		if (offset < 0 || offset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		if (isForMutate) {
			let refManError = new PlwRefManagerError();
			this.stack[offset] = this.refMan.makeMutable(this.stack[offset], refManError);
			if (refManError.hasError()) {
				return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
			}
			this.stackMap[offset] = true;
		}
		this.stack[this.sp] = this.stack[offset];
		this.stackMap[this.sp] = this.stackMap[offset];
		if (this.stackMap[this.sp] === true) {
			let refManError = new PlwRefManagerError();
			this.refMan.incRefCount(this.stack[this.sp], refManError);
			if (refManError.hasError()) {
				return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
			}
		}
		this.sp++;
		return null;
	}
	
	opcodePushLocal(offset, isForMutate) {
		if (this.bp + offset < 0 || this.bp + offset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		if (isForMutate) {
			let refManError = new PlwRefManagerError();
			this.stack[this.bp + offset] = this.refMan.makeMutable(this.stack[this.bp + offset], refManError);
			if (refManError.hasError()) {
				return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
			}
			this.stackMap[this.bp + offset] = true;
		}
		this.stack[this.sp] = this.stack[this.bp + offset];
		this.stackMap[this.sp] = this.stackMap[this.bp + offset];
		if (this.stackMap[this.sp] === true) {
			let refManError = new PlwRefManagerError();
			this.refMan.incRefCount(this.stack[this.sp], refManError);
			if (refManError.hasError()) {
				return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
			}
		}
		this.sp++;
		return null;
	}
	
	opcodePushIndirect(offset, isForMutate) {
		if (this.bp + offset < 0 || this.bp + offset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let directOffset = this.stack[this.bp + offset];
		if (directOffset < 0 || directOffset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}		
		if (isForMutate) {
			let refManError = new PlwRefManagerError();
			this.stack[directOffset] = this.refMan.makeMutable(this.stack[directOffset], refManError);
			if (refManError.hasError()) {
				return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
			}
			this.stackMap[directOffset] = true;
		}
		this.stack[this.sp] = this.stack[directOffset];
		this.stackMap[this.sp] = this.stackMap[directOffset];
		if (this.stackMap[this.sp] === true) {
			let refManError = new PlwRefManagerError();
			this.refMan.incRefCount(this.stack[this.sp], refManError);
			if (refManError.hasError()) {
				return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
			}
		}
		this.sp++;
		return null;
	}
	
	opcodePopGlobal(offset) {
		if (this.sp < 1 || offset < 0 || offset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		if (this.stackMap[offset] === true) {
			let refManError = new PlwRefManagerError();
			this.refMan.decRefCount(this.stack[offset], refManError);
			if (refManError.hasError()) {
				return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
			}						
		}
		this.stack[offset] = this.stack[this.sp - 1];
		this.stackMap[offset] = this.stackMap[this.sp - 1];
		this.sp--;
		return null;
	}
	
	opcodePopLocal(offset) {
		if (this.sp < 1 || this.bp + offset < 0 || this.bp + offset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		if (this.stackMap[this.bp + offset] === true) {
			let refManError = new PlwRefManagerError();
			this.refMan.decRefCount(this.stack[this.bp + offset], refManError);
			if (refManError.hasError()) {
				return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
			}
		}
		this.stack[this.bp + offset] = this.stack[this.sp - 1];
		this.stackMap[this.bp + offset] = this.stackMap[this.sp - 1];
		this.sp--;
		return null;
	}
	
	opcodePopIndirect(offset) {
		if (this.sp < 1 || this.bp + offset < 0 || this.bp + offset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		let directOffset = this.stack[this.bp + offset];
		if (directOffset < 0 || directOffset >= this.sp) {
			return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
		}
		if (this.stackMap[directOffset] === true) {
			let refManError = new PlwRefManagerError();
			this.refMan.decRefCount(this.stack[directOffset], refManError);
			if (refManError.hasError()) {
				return StackMachineError.referenceManagerError(refManError).fromCode(this.codeBlockId, this.ip);
			}
		}
		this.stack[directOffset] = this.stack[this.sp - 1];
		this.stackMap[directOffset] = this.stackMap[this.sp - 1];
		this.sp--;
		return null;
	}
	
	opcode2(code, arg1) {
		switch(code) {
		case OPCODE_JZ:
			if (this.sp < 1) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			if (this.stack[this.sp - 1] === 0) {
				this.ip = arg1;
			}
			this.sp--;
			return null;
		case OPCODE_JNZ:
			if (this.sp < 1) {
				return StackMachineError.stackAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			if (this.stack[this.sp - 1] !== 0) {
				this.ip = arg1;
			}
			this.sp--;
			return null;
		case OPCODE_JMP:
			this.ip = arg1;
			return null;
		case OPCODE_PUSH:
			this.stack[this.sp] = arg1;
			this.stackMap[this.sp] = false;
			this.sp++;
			return null;
		case OPCODE_PUSH_GLOBAL:
		case OPCODE_PUSH_GLOBAL_FOR_MUTATE:
			return this.opcodePushGlobal(arg1, code === OPCODE_PUSH_GLOBAL_FOR_MUTATE);
		case OPCODE_PUSH_LOCAL:
		case OPCODE_PUSH_LOCAL_FOR_MUTATE:
			return this.opcodePushLocal(arg1, code === OPCODE_PUSH_GLOBAL_FOR_MUTATE);
		case OPCODE_PUSH_INDIRECTION:
			this.stack[this.sp] = this.bp + arg1;
			this.stackMap[this.sp] = false;
			this.sp++;
			return null;
		case OPCODE_PUSH_INDIRECT:
		case OPCODE_PUSH_INDIRECT_FOR_MUTATE:
			return this.opcodePushIndirect(arg1, code === OPCODE_PUSH_INDIRECT_FOR_MUTATE);
		case OPCODE_POP_GLOBAL:
			return this.opcodePopGlobal(arg1);
		case OPCODE_POP_LOCAL:
			return this.opcodePopLocal(arg1);
		case OPCODE_POP_INDIRECT:
			return this.opcodePopIndirect(arg1);
		case OPCODE_POP_VOID:
			return this.opcodePopVoid(arg1);
		case OPCODE_CREATE_STRING:
			return this.opcodeCreateString(arg1);
		case OPCODE_CREATE_RECORD:
			return this.opcodeCreateRecord(arg1);
		case OPCODE_CREATE_BASIC_ARRAY:
			return this.opcodeCreateBasicArray(arg1);
		case OPCODE_CREATE_ARRAY:
			return this.opcodeCreateArray(arg1);
		case OPCODE_CALL:
			if (arg1 < 0 || arg1 > this.codeBlocks.length) {
				return StackMachineError.codeAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
			}
			this.stack[this.sp] = this.codeBlockId;
			this.stackMap[this.sp] = false;
			this.sp++;
			this.stack[this.sp] = this.ip;
			this.stackMap[this.sp] = false;
			this.sp++;					
			this.stack[this.sp] = this.bp;
			this.stackMap[this.sp] = false;
			this.sp++;
			this.bp = this.sp;
			this.codeBlockId = arg1;
			this.ip = 0;
			return null;
		case OPCODE_CALL_ABSTRACT:
			return this.opcodeCallAbstract(arg1);
		case OPCODE_CALL_NATIVE:
			return this.opcodeCallNative(arg1);
		case OPCODE_INIT_GENERATOR:
			return this.opcodeInitGenerator(arg1);
		case OPCODE_CREATE_EXCEPTION_HANDLER:
			this.stack[this.sp] = PlwExceptionHandlerRef.make(this.refMan, this.codeBlockId, arg1, this.bp);
			this.stackMap[this.sp] = true;
			this.sp++;
			return null;
		default:
			return StackMachineError.unknownOp().fromCode(this.codeBlockId, this.ip);
		}
	}
	
	runLoop() {
		let code = 0;
		let ret = null;
		let arg1 = 0;
		while (this.ip < this.codeBlocks[this.codeBlockId].codeSize) {
			code = this.codeBlocks[this.codeBlockId].codes[this.ip];
			this.ip++;
			if (code <= OPCODE1_MAX) {
				ret = this.opcode1(code);
			} else {
				if (this.ip >= this.codeBlocks[this.codeBlockId].codeSize) {
					return StackMachineError.codeAccessOutOfBound().fromCode(this.codeBlockId, this.ip);
				}
				arg1 = this.codeBlocks[this.codeBlockId].codes[this.ip];
				this.ip++;
				ret = this.opcode2(code, arg1);
			}
			if (ret !== null) {
				return ret;
			}
		}
		return null;
	}

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
	
	static initStdNativeFunctions(compilerContext) {
		let nativeFunctionManager = new NativeFunctionManager();
		
		compilerContext.addProcedure(EvalResultProcedure.fromNative(
			"debug",
			new EvalResultParameterList(0, []),
			nativeFunctionManager.addFunction(function(sm) {
				console.log(sm);
				return null;
			})
		));


		compilerContext.addProcedure(EvalResultProcedure.fromNative(
			"print",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				printTextOut(ref.str);
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.sp -= 2;
				return null;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"print",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				printTextOut(ref.str);
				sm.sp -= 1;
				return null;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
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
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
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
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
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
				
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"length_basic_array",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_REF)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BASIC_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let len = ref.arraySize;
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 2] = len;
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"length_array",
			new EvalResultParameterList(1, [new EvalResultParameter("r", EVAL_TYPE_REF)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let len = ref.arraySize;
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 2] = len;
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"length",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			EVAL_TYPE_INTEGER,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let len = ref.str.length;
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 2] = len;
				sm.stackMap[sm.sp - 2] = false;
				sm.sp -= 1;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compilerContext.addType(new EvalTypeArray(EVAL_TYPE_CHAR)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BASIC_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let resultId = PlwStringRef.make(sm.refMan, String.fromCharCode(...ref.ptr));
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compilerContext.addType(new EvalTypeArray(EVAL_TYPE_INTEGER)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BASIC_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let resultId = PlwStringRef.make(sm.refMan, "[" + ref.ptr + "]");
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compilerContext.addType(new EvalTypeArray(EVAL_TYPE_TEXT)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 1) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refId = sm.stack[sm.sp - 2];
				let refManError = new PlwRefManagerError();
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let str = "[";
				for (let i = 0; i < ref.arraySize; i++) {
					let subRef = sm.refMan.getRefOfType(ref.ptr[i], PLW_TAG_REF_STRING, refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError);
					}
					str += (i > 0 ? ", " : "") + subRef.str;
				}
				str += "]";
				let resultId = PlwStringRef.make(sm.refMan, str);
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
				return null;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
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
				let refManError = new PlwRefManagerError();
				let refId1 = sm.stack[sm.sp - 3];
				let refId2 = sm.stack[sm.sp - 2];
				let ref1 = sm.refMan.getRefOfType(refId1, PLW_TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let ref2 = sm.refMan.getRefOfType(refId2, PLW_TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				if (ref1.refCount === 1) {
					ref1.str += ref2.str;
					sm.refMan.decRefCount(refId2, refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError);
					}
				} else {
					let resultRefId = PlwStringRef.make(sm.refMan, ref1.str + ref2.str);
					sm.refMan.decRefCount(refId1, refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError);
					}
					sm.refMan.decRefCount(refId2, refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError);
					}
					sm.stack[sm.sp - 3] = resultRefId;
					sm.stackMap[sm.sp - 3] = true;
				}
				sm.sp -= 2;
				return null;
			})
		));


		compilerContext.addFunction(EvalResultFunction.fromNative(
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
				let refManError = new PlwRefManagerError();
				let refId = sm.stack[sm.sp - 4];
				let beginIndex = sm.stack[sm.sp - 3];
				let length = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
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
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 4] = resultRefId;
				sm.stackMap[sm.sp - 4] = true;
				sm.sp -= 3;
				return null;
			})
		));	
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
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
				let refManError = new PlwRefManagerError();
				let refId = sm.stack[sm.sp - 3];
				let index = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				if (index < 0 || index >= ref.str.length) {
					return StackMachineError.refAccessOutOfBound();
				}
				let charCode = ref.str.charCodeAt(index)
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 3] = charCode;
				sm.stackMap[sm.sp - 3] = false;
				sm.sp -= 2;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"slice_basic_array",
			new EvalResultParameterList(3, [
				new EvalResultParameter("array", EVAL_TYPE_REF),
				new EvalResultParameter("beginIndex", EVAL_TYPE_INTEGER),
				new EvalResultParameter("endIndex", EVAL_TYPE_INTEGER),
			]),
			EVAL_TYPE_REF,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 3) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refManError = new PlwRefManagerError();
				let refId = sm.stack[sm.sp - 4];
				let beginIndex = sm.stack[sm.sp - 3];
				let endIndex = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BASIC_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				if (beginIndex < 0 || endIndex >= ref.arraySize) {
					return StackMachineError.refAccessOutOfBound();
				}
				let arraySize = endIndex - beginIndex + 1;
				if (arraySize < 0) {
					arraySize = 0;
				}
				let ptr = ref.ptr.slice(beginIndex, beginIndex + arraySize);
				let resultRefId = PlwBasicArrayRef.make(sm.refMan, arraySize, ptr);
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 4] = resultRefId;
				sm.stackMap[sm.sp - 4] = true;
				sm.sp -= 3;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"slice_array",
			new EvalResultParameterList(3, [
				new EvalResultParameter("array", EVAL_TYPE_REF),
				new EvalResultParameter("beginIndex", EVAL_TYPE_INTEGER),
				new EvalResultParameter("endIndex", EVAL_TYPE_INTEGER),
			]),
			EVAL_TYPE_REF,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 3) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refManError = new PlwRefManagerError();
				let refId = sm.stack[sm.sp - 4];
				let beginIndex = sm.stack[sm.sp - 3];
				let endIndex = sm.stack[sm.sp - 2];
				let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				if (beginIndex < 0 || endIndex >= ref.arraySize) {
					return StackMachineError.refAccessOutOfBound();
				}
				let arraySize = endIndex - beginIndex + 1;
				if (arraySize < 0) {
					arraySize = 0;
				}
				let ptr = ref.ptr.slice(beginIndex, beginIndex + arraySize);
				for (let i = 0; i < arraySize; i++) {
					sm.refMan.incRefCount(ptr[i], refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError);
					}
				}
				let resultRefId = PlwArrayRef.make(sm.refMan, arraySize, ptr);
				sm.refMan.decRefCount(refId, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 4] = resultRefId;
				sm.stackMap[sm.sp - 4] = true;
				sm.sp -= 3;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"concat_basic_array",
			new EvalResultParameterList(2, [
				new EvalResultParameter("a1", EVAL_TYPE_REF),
				new EvalResultParameter("a2", EVAL_TYPE_REF)
			]),
			EVAL_TYPE_REF,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refManError = new PlwRefManagerError();
				let refId1 = sm.stack[sm.sp - 3];
				let refId2 = sm.stack[sm.sp - 2];
				let ref1 = sm.refMan.getRefOfType(refId1, PLW_TAG_REF_BASIC_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}		
				let ref2 = sm.refMan.getRefOfType(refId2, PLW_TAG_REF_BASIC_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let newArraySize = ref1.arraySize + ref2.arraySize;
				let ptr = ref1.ptr.concat(ref2.ptr);
				let resultRefId = PlwBasicArrayRef.make(sm.refMan, newArraySize, ptr);
				sm.refMan.decRefCount(refId1, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.refMan.decRefCount(refId2, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 3] = resultRefId;
				sm.stackMap[sm.sp - 3] = true;
				sm.sp -= 2;
				return null;
			})
		));

		
		compilerContext.addFunction(EvalResultFunction.fromNative(
			"concat_array",
			new EvalResultParameterList(2, [
				new EvalResultParameter("a1", EVAL_TYPE_REF),
				new EvalResultParameter("a2", EVAL_TYPE_REF)
			]),
			EVAL_TYPE_REF,
			nativeFunctionManager.addFunction(function(sm) {
				if (sm.stack[sm.sp - 1] !== 2) {
					return StackMachineError.nativeArgCountMismatch();
				}
				let refManError = new PlwRefManagerError();
				let refId1 = sm.stack[sm.sp - 3];
				let refId2 = sm.stack[sm.sp - 2];
				let ref1 = sm.refMan.getRefOfType(refId1, PLW_TAG_REF_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}		
				let ref2 = sm.refMan.getRefOfType(refId2, PLW_TAG_REF_ARRAY, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				let newArraySize = ref1.arraySize + ref2.arraySize;
				let ptr = ref1.ptr.concat(ref2.ptr);
				for (let i = 0; i < newArraySize; i++) {
					sm.refMan.incRefCount(ptr[i], refManError);
					if (refManError.hasError()) {
						return StackMachineError.referenceManagerError(refManError);
					}
				}
				let resultRefId = PlwArrayRef.make(sm.refMan, newArraySize, ptr);
				sm.refMan.decRefCount(refId1, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.refMan.decRefCount(refId2, refManError);
				if (refManError.hasError()) {
					return StackMachineError.referenceManagerError(refManError);
				}
				sm.stack[sm.sp - 3] = resultRefId;
				sm.stackMap[sm.sp - 3] = true;
				sm.sp -= 2;
				return null;
			})
		));
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
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

		
		compilerContext.addFunction(EvalResultFunction.fromNative(
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

		compilerContext.addFunction(EvalResultFunction.fromNative(
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
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
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
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
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
		
		compilerContext.addFunction(EvalResultFunction.fromNative(
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

		return nativeFunctionManager;
	}
}

const fs = require("fs");
const stream = require("stream");

function printTextOut(txt) {
	console.log(txt);
}

let compilerContext = new CompilerContext();
let nativeFunctionManager = NativeFunctionManager.initStdNativeFunctions(compilerContext);

compilerContext.addFunction(EvalResultFunction.fromNative(
	"get_char",
	new EvalResultParameterList(0, []),
	EVAL_TYPE_CHAR,
	nativeFunctionManager.addFunction(function(sm) {
		if (sm.stack[sm.sp - 1] !== 0) {
			return new StackMachineError().nativeArgCountMismatch();
		}
		let buffer = new Int8Array(1);
  		fs.readSync(0, buffer, 0, 1);
		sm.stack[sm.sp - 1] = buffer[0];
		sm.stackMap[sm.sp - 1] = false;
		return null;
	})
));

compilerContext.addProcedure(EvalResultProcedure.fromNative(
	"write",
	new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
	nativeFunctionManager.addFunction(function(sm) {
		if (sm.stack[sm.sp - 1] !== 1) {
			return StackMachineError.nativeArgCountMismatch();
		}
		let refId = sm.stack[sm.sp - 2];
		let refManError = new PlwRefManagerError();
		let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, refManError);
		if (refManError.hasError()) {
			return StackMachineError.referenceManagerError(refManError);
		}
		process.stdout.write(ref.str);
		sm.refMan.decRefCount(refId, refManError);
		if (refManError.hasError()) {
			return StackMachineError.referenceManagerError(refManError);
		}
		sm.sp -= 2;
		return null;
	})
));

let stackMachine = new StackMachine();

if (process.argv.length < 3) {
	console.log("Error: no source file");
	process.exit(1);
}

const sourceCode = fs.readFileSync(process.argv[2], 'utf8');

let tokenReader = new TokenReader(sourceCode, 1, 1);
let parser = new Parser(tokenReader);
let compiler = new Compiler(compilerContext);

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
		break;
	} else {
		let smRet = stackMachine.execute(compiler.codeBlock, compilerContext.codeBlocks, nativeFunctionManager.functions);
		if (smRet !== null) {
			console.log(JSON.stringify(smRet));
			console.log(JSON.stringify(stackMachine.codeBlocks[smRet.currentBlockId], undefined, 4));
			break;
		}
	}
}

console.log("done");


