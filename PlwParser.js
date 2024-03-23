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
	
	readTemplateToken(templateQuote = null) {
		let token = this.nextToken;
		this.nextToken = this.tokenReader.readTemplateToken(templateQuote === null ? token.text : templateQuote);
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
		} else if (this.peekToken() === TOK_LOOP) {
			stmt = this.readLoop();
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
		
		if (this.peekToken() === TOK_TEMPLATE) {
			return this.readTemplate();
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
		return new AstCase(caseExpr, whenIndex, whens, elseExpr).fromToken(caseToken);
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
		return new AstWhen(whenExpr, thenExpr).fromToken(whenToken);
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
		return new AstKindof(caseExpr, whenIndex, whens, elseExpr).fromToken(kindofToken);
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
		return new AstKindofWhen(type, varName.text, thenExpr).fromToken(whenToken);
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
		return new AstKindofStmt(caseExpr, whenIndex, whens, elseBlock).fromToken(kindofToken);
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
	
	readTemplate() {
		let openToken = this.readTemplateToken();
		if (openToken.tag !== TOK_TEMPLATE) {
			return ParserError.unexpectedToken(openToken, [TOK_TEMPLATE]);			
		}
		let exprs = [];
		let exprIndex = 0;
		while (this.peekToken() !== TOK_TEMPLATE) {
			if (this.peekToken() === TOK_STRING) {
				let strToken = this.readTemplateToken(openToken.text);
				exprs[exprIndex] = new AstValueText(strToken.text).fromToken(strToken);
				exprIndex++;
			} else if (this.peekToken() === TOK_BEGIN_AGG) {
				let beginAggToken = this.readToken();
				let expr = this.readExpression();
				if (Parser.isError(expr)) {
					return expr;
				}
				exprs[exprIndex] = expr;
				exprIndex++;
				let endAggToken = this.readTemplateToken(openToken.text);
				if (endAggToken.tag != TOK_END_AGG) {
					return ParserError.unexpectedToken(endAggToken, [TOK_END_AGG]);
				}
			} else {
				let wrongToken = this.readToken();
				return ParserError.unexpectedToken(wrongToken, [TOK_STRING, TOK_BEGIN_AGG, TOK_TEMPLATE]);
			}
		}
		this.readToken();
		if (exprIndex === 0) {
			return new AstValueText("").fromToken(openToken);
		} else if (exprIndex === 1 && exprs[0].tag === "ast-value-text") {
			return exprs[0];
		}
		return new AstTemplate(exprIndex, exprs).fromToken(openToken);
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
		let sepToken = null;
		while (this.peekToken() === TOK_TYPE_SEP) {
			sepToken = this.readToken();
			let type = this.readTypeNoVariant();
			if (Parser.isError(type)) {
				return type;
			}
			types[typeCount] = type;
			typeCount++;
		}
		return new AstTypeVariant(typeCount, types).fromToken(sepToken);
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
	
	readLoop() {
		let statement = this.readLoopBlock();
		if (Parser.isError(statement)) {
			return statement;
		}
		return new AstLoop(statement);		
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
