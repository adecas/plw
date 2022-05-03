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
		if (this.peekToken() === TOK_VAR) {
			stmt = this.readVariableDeclaration();
		} else if (this.peekToken() === TOK_IF) {
			stmt = this.readIf();
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
		} else if (this.peekToken() == TOK_FOR) {
			stmt = this.readFor();
		} else if (this.peekToken() == TOK_BEGIN) {
			stmt = this.readBlock(false, null);
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
			
		while (this.peekToken() === TOK_ADD || this.peekToken() === TOK_SUB || this.peekToken() === TOK_CONCAT) {
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
		let left = this.readExpr1();		
		if (Parser.isError(left)) {
			return left;
		}
			
		while (this.peekToken() === TOK_MUL || this.peekToken() === TOK_DIV || this.peekToken() === TOK_REM) {
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
			} else {
				return ParserError.unexpectedToken(token, [TOK_BEGIN_ARRAY, TOK_SEL]);					
			}
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
			TOK_SUB, TOK_NOT, TOK_BEGIN_AGG, TOK_BEGIN_ARRAY, TOK_BEGIN_GROUP
		]);
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
		let itemType = null;
		if (this.peekToken() !== TOK_ASSIGN) {
			itemType = this.readType();
			if (Parser.isError(itemType)) {
				return itemType;
			}
		}
		let assignToken = this.readToken();
		if (assignToken.tag !== TOK_ASSIGN) {
			return ParserError.unexpectedToken(assignToken, [TOK_ASSIGN]);
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
		return new AstValueArray(itemType, itemIndex, itemValues).fromToken(openToken);
	}
	
	readRecordValueField() {
		let fieldName = this.readToken();
		if (fieldName.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(fieldName, [TOK_IDENTIFIER])
		}
		let fieldType = null;
		if (this.peekToken() !== TOK_ASSIGN) {
			fieldType = this.readType();
			if (Parser.isError(fieldType)) {
				return fieldType;
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
		return new AstValueRecordField(fieldName.text, fieldType, expr).fromToken(fieldName);	
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
		if (this.peekToken() === TOK_BEGIN_AGG) {
			return this.readTypeRecord();
		}
		if (this.peekToken() === TOK_BEGIN_ARRAY) {
			return this.readTypeArray();
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
	
	readTypeDeclaration() {
		let typeToken = this.readToken();
		if (typeToken.tag !== TOK_TYPE) {
			return ParserError.unexpectedToken(varToken, [TOK_TYPE]);
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
		if (varToken.tag !== TOK_VAR) {
			return ParserError.unexpectedToken(varToken, [TOK_VAR]);
		}
		let varName = this.readToken();
		if (varName.tag !== TOK_IDENTIFIER) {
			return ParserError.unexpectedToken(varName, [TOK_IDENTIFIER])
		}
		let varType = null;
		if (this.peekToken() !== TOK_ASSIGN) {
			varType = this.readType();
			if (Parser.isError(varType)) {
				return varType;
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
		return new AstVariableDeclaration(varName.text, varType, expr).fromToken(varToken);
	}
	
	readIfBlock(fromToken) {
		let statementIndex = 0;
		let statements = [];
		let token = this.peekToken();
		while (token !== TOK_END && token !== TOK_ELSE && token !== TOK_ELSIF) {
			let statement = this.readStatement();
			if (Parser.isError(statement)) {
				return statement;
			}
			statements[statementIndex] = statement;
			statementIndex++;			
			token = this.peekToken();
		}
		return new AstBlock(statementIndex, statements).fromToken(fromToken);
	}
	
	readIf() {
		return this.readIfOrElsif(true);
	}
	
	readElsif() {
		return this.readIfOrElsif(false);
	}
	
	readIfOrElsif(isIf) {
		let ifToken = this.readToken();
		if (ifToken.tag !== (isIf ? TOK_IF : TOK_ELSIF)) {
			return ParserError.unexpectedToken(ifToken, [isIf ? TOK_IF : TOK_ELSIF]);
		}
		let condition = this.readExpression();
		if (Parser.isError(condition)) {
			return condition;
		}
		let thenToken = this.readToken();
		if (thenToken.tag !== TOK_THEN) {
			return ParserError.unexpectedToken(ifToken, [TOK_THEN]);
		}
		let trueStatement = this.readIfBlock(thenToken);
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
			let elseToken = this.readToken();
			falseStatement = this.readIfBlock(elseToken);
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
	
	readBlock(isLoop, endTokenSuffixText) {
		let beginToken = this.readToken();
		if (beginToken.tag !== (isLoop ? TOK_LOOP : TOK_BEGIN)) {
			return ParserError.unexpectedToken(beginToken, [isLoop ? TOK_LOOP : TOK_BEGIN]);
		}
		let statementIndex = 0;
		let statements = [];
		let token = this.peekToken();
		while (token !== TOK_END) {
			let statement = this.readStatement();
			if (Parser.isError(statement)) {
				return statement;
			}
			statements[statementIndex] = statement;
			statementIndex++;			
			token = this.peekToken();
		}
		let endToken = this.readToken();
		if (endToken.tag !== TOK_END) {
			return ParserError.unexpectedToken(endToken, [TOK_END]);
		}
		if (isLoop) {
			let endLoopToken = this.readToken();
			if (endLoopToken.tag !== TOK_LOOP) {
				return ParserError.unexpectedToken(endLoopToken, [TOK_LOOP]);
			}
		} 
		if (endTokenSuffixText !== null) {
			let endTokenSuffix = this.readToken();
			if (endTokenSuffix.tag !== TOK_IDENTIFIER) {
				return ParserError.unexpectedToken(endTokenSuffix, [TOK_IDENTIFIER]);
			}
			if (endTokenSuffix.text !== endTokenSuffixText) {
				return ParserError.wrongEndSuffix(endTokenSuffix, endTokenSuffixText);
			}
		}
		return new AstBlock(statementIndex, statements).fromToken(beginToken);
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
		let statement = this.readBlock(true, null);
		if (Parser.isError(statement)) {
			return statement;
		}
		return new AstWhile(condition, statement).fromToken(whileToken);
	}
	
	readParameter() {
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

	readParameterList() {
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
			let parameter = this.readParameter();
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
		let parameterList = this.readParameterList();
		if (Parser.isError(parameterList)) {
			return parameterList;
		}
		let returnType = this.readType();
		if (Parser.isError(returnType)) {
			return returnType;
		}
		let statement = this.readBlock(false, functionName.text);
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
		let parameterList = this.readParameterList();
		if (Parser.isError(parameterList)) {
			return parameterList;
		}
		let statement = this.readBlock(false, procedureName.text);
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
		let statement = this.readBlock(true, null);
		if (Parser.isError(statement)) {
			return statement;
		}
		return new AstFor(index.text, isReverse, sequence, statement).fromToken(forToken);
	}
}
