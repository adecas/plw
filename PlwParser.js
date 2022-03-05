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
		return new ParserError("Unexpected token " + token.text + ", expected " + expected).fromToken(token);
	}
	
}

class Parser {

	constructor(tokenReader) {
		this.tokenReader = tokenReader;
		this.nextToken = null;
		this.readToken();
	}
	
	peekToken() {
		return this.nextToken.text;
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
		if (this.peekToken() === "var") {
			stmt = this.readVariableDeclaration();
		} else if (this.peekToken() === "if") {
			stmt = this.readIf();
		} else if (this.peekToken() === "while") {
			stmt = this.readWhile();
		} else if (this.peekToken() === "function" || this.peekToken() === "generator") {
			stmt = this.readFunctionDeclaration();
		} else if (this.peekToken() === "procedure") {
			stmt = this.readProcedureDeclaration();
		} else if (this.peekToken() === "type") {
			stmt = this.readTypeDeclaration();
		} else if (this.peekToken() === "return") {
			stmt = this.readReturn();
		} else if (this.peekToken() === "yield") {
			stmt = this.readYield();
		} else if (this.peekToken() == "for") {
			stmt = this.readFor();
		} else if (this.peekToken() == "begin") {
			stmt = this.readBlock("begin", "end", null);
		} else {
			stmt = this.readAssign();
		}
		if (Parser.isError(stmt)) {
			return stmt;
		}
		let smToken = this.readToken();
		if (smToken.text !== ";") {
			return ParserError.unexpectedToken(smToken, ";");					
		}
		return stmt;
	}
	
	readAssign() {
		let expr = this.readExpression();
		if (Parser.isError(expr)) {
			return expr;
		}
		if (this.peekToken() !== ":=" && expr.tag === "ast-function") {
			return AstProcedure.fromFunction(expr);
		}
		let assignToken = this.readToken();
		if (assignToken.text !== ":=") {
			return ParserError.unexpectedToken(assignToken, ":=");					
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
			
		while (this.peekToken() === "or") {
			let operator = this.readToken();
			
			let right = this.readExpr5();
			if (Parser.isError(right)) {
				return right;
			}
			
			left = new AstOperatorBinary(operator.text, left, right).fromToken(operator);
		}
		
		return left;
	}
	
	readExpr5() {
		let left = this.readExpr4();		
		if (Parser.isError(left)) {
			return left;
		}
			
		while (this.peekToken() === "and") {
			let operator = this.readToken();
			
			let right = this.readExpr4();
			if (Parser.isError(right)) {
				return right;
			}
			
			left = new AstOperatorBinary(operator.text, left, right).fromToken(operator);
		}
		
		return left;
	}
		
	readExpr4() {
		let left = this.readExpr3();
		if (Parser.isError(left)) {
			return left;
		}
		
		if (
			this.peekToken() === "=" ||
			this.peekToken() === ">" ||
			this.peekToken() === "<" ||
			this.peekToken() === ">=" ||
			this.peekToken() === "<=" ||
			this.peekToken() === "<>"
		) {
			let operator = this.readToken();
			let right = this.readExpr3();
			if (Parser.isError(right)) {
				return right;
			}
			left = new AstOperatorBinary(operator.text, left, right).fromToken(operator);
		}
		
		return left;
	}

	readExpr3() {
		let left = this.readExpr2();		
		if (Parser.isError(left)) {
			return left;
		}
			
		while (this.peekToken() === "+" || this.peekToken() === "-" || this.peekToken() === "||") {
			let operator = this.readToken();
			
			let right = this.readExpr2();
			if (Parser.isError(right)) {
				return right;
			}
			
			left = new AstOperatorBinary(operator.text, left, right).fromToken(operator);
		}
		
		return left;
	}
	
	readExpr2() {
		let left = this.readExpr1();		
		if (Parser.isError(left)) {
			return left;
		}
			
		while (this.peekToken() === "*" || this.peekToken() === "/") {
			let operator = this.readToken();
			
			let right = this.readExpr1();
			if (Parser.isError(right)) {
				return right;
			}
			
			left = new AstOperatorBinary(operator.text, left, right).fromToken(operator);
		}
		
		return left;
	}
	
	readExpr1() {
		let expr = this.readExpr0();
		if (Parser.isError(expr)) {
			return expr;
		}
		
		while (this.peekToken() === "[" || this.peekToken() === ".") {			
			let token = this.readToken();
			if (token.text === "[") {
				let index = this.readExpression();
				if (Parser.isError(index)) {
					return index;
				}
				expr = new AstIndex(expr, index).fromToken(token);
				let closeToken = this.readToken();
				if (closeToken.text !== "]") {
					return ParserError.unexpectedToken(closeToken, "]");					
				}
			} else if (token.text === ".") {
				let fieldName = this.readToken();
				if (!TokenReader.isIdentifier(fieldName.text)) {
					return ParserError.unexpectedToken(fieldName, "identifier")
				}
				expr = new AstField(expr, fieldName.text).fromToken(token);
			} else {
				return ParserError.unexpectedToken(token, "[, .");					
			}
		}
		
		return expr;
	}

	readExpr0() {
	
		if (this.peekToken() === "(") {
			return this.readExprGroup();
		}
	
		if (this.peekToken() === "[") {
			return this.readArrayValue();
		}
		
		if (this.peekToken() === "{") {
			return this.readRecordValue();
		}
					
		let token = this.readToken();

		if (token.text === "-" || token.text === "not") {
			let operand = this.readExpr1();
			if (Parser.isError(operand)) {
				return operand;
			}
			return new AstOperatorUnary(token.text, operand).fromToken(token);
		}
		
		if (token.text === "true" || token.text === "false") {
			return new AstValueBoolean(token.text === "true").fromToken(token);
		}
		
		if (token.text === "length" && this.peekToken() === "(") {
			let groupExpr = this.readExprGroup();
			if (Parser.isError(groupExpr)) {
				return groupExpr;
			}
			return new AstOperatorUnary("length", groupExpr).fromToken(token);
		}
		
		if (token.text === "next" && this.peekToken() === "(") {
			let groupExpr = this.readExprGroup();
			if (Parser.isError(groupExpr)) {
				return groupExpr;
			}
			return new AstOperatorUnary("next", groupExpr).fromToken(token);
		}

		if (token.text === "ended" && this.peekToken() === "(") {
			let groupExpr = this.readExprGroup();
			if (Parser.isError(groupExpr)) {
				return groupExpr;
			}
			return new AstOperatorUnary("ended", groupExpr).fromToken(token);
		}

		if (TokenReader.isInteger(token.text)) {
			return new AstValueInteger(parseInt(token.text, 10)).fromToken(token);
		}
		
		if (TokenReader.isString(token.text)) {
			return new AstValueText(TokenReader.unescapeString(token.text)).fromToken(token);
		}
		
		if (TokenReader.isIdentifier(token.text)) {
			if (this.peekToken() === "(") {
				let argList = this.readArgList();
				if (Parser.isError(argList)) {
					return argList;
				}
				return new AstFunction(token.text, argList).fromToken(token);
			} else {
				return new AstVariable(token.text).fromToken(token);
			}
		}
		
		return ParserError.unexpectedToken(token, "expression");			
	}
	
	readExprGroup() {
		let openToken = this.readToken();
		if (openToken.text !== "(") {
			return ParserError.unexpectedToken(openToken, "(");			
		}
		let groupExpr = this.readExpression();
		if (Parser.isError(groupExpr)) {
			return groupExpr;
		}
		let closeToken = this.readToken();
		if (closeToken.text !== ")") {
			return ParserError.unexpectedToken(closeToken, ")");			
		}
		return groupExpr;
	}
	
	readArrayValue() {
		let openToken = this.readToken();
		if (openToken.text !== "[") {
			return ParserError.unexpectedToken(openToken, "[");
		}
		let itemValues = [];
		let itemIndex = 0;
		while (this.peekToken() !== "]") {
			let valExpr = this.readExpression();
			if (Parser.isError(valExpr)) {
				return valExpr;
			}
			itemValues[itemIndex] = valExpr;
			itemIndex++;
			if (this.peekToken() === "]") {
				break;
			}
			let sepToken = this.readToken();
			if (sepToken.text != ",") {
				return ParserError.unexpectedToken(sepToken, "], ,");
			}
		}
		let closeToken = this.readToken();
		if (closeToken.text !== "]") {
			return ParserError.unexpectedToken(closeToken, "]");
		}
		return new AstValueArray(itemIndex, itemValues).fromToken(openToken);
	}
	
	readRecordValueField() {
		let fieldName = this.readToken();
		if (!TokenReader.isIdentifier(fieldName.text)) {
			return ParserError.unexpectedToken(fieldName, "identifier")
		}
		let fieldType = null;
		if (this.peekToken() !== ":=") {
			fieldType = this.readType();
			if (Parser.isError(fieldType)) {
				return fieldType;
			}
		}
		let assign = this.readToken();
		if (assign.text !== ":=") {
			return ParserError.unexpectedToken(assign, ":=");
		}
		let expr = this.readExpression();
		if (Parser.isError(expr)) {
			return expr;
		}
		return new AstValueRecordField(fieldName.text, fieldType, expr).fromToken(fieldName);	
	}
	
	readRecordValue() {
		let openToken = this.readToken();
		if (openToken.text !== "{") {
			return ParserError.unexpectedToken(openToken, "{");
		}
		let fields = [];
		let fieldIndex = 0;
		while (this.peekToken() !== "}") {
			let fieldExpr = this.readRecordValueField();
			if (Parser.isError(fieldExpr)) {
				return fieldExpr;
			}
			fields[fieldIndex] = fieldExpr;
			fieldIndex++;
			if (this.peekToken() === "}") {
				break;
			}
			let sepToken = this.readToken();
			if (sepToken.text != ",") {
				return ParserError.unexpectedToken(sepToken, "}, ,");
			}
		}
		let closeToken = this.readToken();
		if (closeToken.text !== "}") {
			return ParserError.unexpectedToken(closeToken, "}");
		}
		return new AstValueRecord(fieldIndex, fields).fromToken(openToken);		
	}
	
	readType() {
		if (this.peekToken() === "sequence") {
			return this.readTypeSequence();
		}
		if (this.peekToken() === "{") {
			return this.readTypeRecord();
		}
		let typeName = this.readToken();
		if (!TokenReader.isIdentifier(typeName.text)) {
			return ParserError.unexpectedToken(typeName, "identifier");
		}
		let typeExpr = new AstTypeNamed(typeName.text).fromToken(typeName);
		while (this.peekToken() === "[") {
			let openToken = this.readToken();
			let closeToken = this.readToken();
			if (closeToken.text !== "]") {
				return ParserError.unexpectedToken(closeToken, "]");
			}
			typeExpr = new AstTypeArray(typeExpr).fromToken(openToken);
		}
		return typeExpr;
	}
	
	readTypeSequence() {
		let seqToken = this.readToken();
		if (seqToken.text !== "sequence") {
			return ParserError.unexpectedToken(fieldName, "identifier")
		}
		let openToken = this.readToken();
		if (openToken.text !== "(") {
			return ParserError.unexpectedToken(openToken, "(");
		}
		let underlyingType = this.readType();
		if (Parser.isError(underlyingType)) {
			return underlyingType;
		}
		let closeToken = this.readToken();
		if (closeToken.text !== ")") {
			return ParserError.unexpectedToken(closeToken, ")");
		}
		return new AstTypeSequence(underlyingType);
	}
	
	readTypeRecordField() {
		let fieldName = this.readToken();
		if (!TokenReader.isIdentifier(fieldName.text)) {
			return ParserError.unexpectedToken(fieldName, "identifier")
		}
		let fieldType = this.readType();
		if (Parser.isError(fieldType)) {
			return fieldType;
		}
		return new AstTypeRecordField(fieldName.text, fieldType).fromToken(fieldName);	
	}

	readTypeRecord() {
		let openToken = this.readToken();
		if (openToken.text !== "{") {
			return ParserError.unexpectedToken(openToken, "{");
		}
		let fields = [];
		let fieldIndex = 0;
		while (this.peekToken() !== "}") {
			if (fieldIndex > 0) {
				let sepToken = this.readToken();
				if (sepToken.text != ",") {
					return ParserError.unexpectedToken(sepToken, "}, ,");
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
		if (closeToken.text !== "}") {
			return ParserError.unexpectedToken(closeToken, "}");
		}
		return new AstTypeRecord(fieldIndex, fields).fromToken(openToken);		
	}
	
	readTypeDeclaration() {
		let typeToken = this.readToken();
		if (typeToken.text !== "type") {
			return ParserError.unexpectedToken(varToken, "type");
		}
		let typeName = this.readToken();
		if (!TokenReader.isIdentifier(typeName.text)) {
			return ParserError.unexpectedToken(typeName, "identifier")
		}
		let typeExpr = this.readType();
		if (Parser.isError(typeExpr)) {
			return typeExpr;
		}
		return new AstTypeDeclaration(typeName.text, typeExpr).fromToken(typeToken);
	}
	
	readVariableDeclaration() {
		let varToken = this.readToken();
		if (varToken.text !== "var") {
			return ParserError.unexpectedToken(varToken, "var");
		}
		let varName = this.readToken();
		if (!TokenReader.isIdentifier(varName.text)) {
			return ParserError.unexpectedToken(varName, "identifier")
		}
		let varType = null;
		if (this.peekToken() !== ":=") {
			varType = this.readType();
			if (Parser.isError(varType)) {
				return varType;
			}
		}
		let assign = this.readToken();
		if (assign.text !== ":=") {
			return ParserError.unexpectedToken(assign, ":=");
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
		while (token !== "end" && token !== "else" && token !== "elsif") {
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
		if (ifToken.text !== (isIf ? "if" : "elsif")) {
			return ParserError.unexpectedToken(ifToken, (isIf ? "if" : "elsif"));
		}
		let condition = this.readExpression();
		if (Parser.isError(condition)) {
			return condition;
		}
		let thenToken = this.readToken();
		if (thenToken.text !== "then") {
			return ParserError.unexpectedToken(ifToken, "then");
		}
		let trueStatement = this.readIfBlock(thenToken);
		if (Parser.isError(trueStatement)) {
			return trueStatement;
		}
		if (this.peekToken() === "elsif") {
			let falseStatement = this.readElsif();
			if (Parser.isError(falseStatement)) {
				return falseStatement;
			}
			return new AstIf(condition, trueStatement, falseStatement).fromToken(ifToken);
		}
		let falseStatement = null;
		if (this.peekToken() === "else") {
			let elseToken = this.readToken();
			falseStatement = this.readIfBlock(elseToken);
			if (Parser.isError(falseStatement)) {
				return falseStatement;
			}
		}
		let endToken = this.readToken();
		if (endToken.text !== "end") {
			return ParserError.unexpectedToken(endToken, "end");
		}
		let endIfToken = this.readToken();
		if (endIfToken.text !== "if") {
			return ParserError.unexpectedToken(endIfToken, "if");
		}
		return new AstIf(condition, trueStatement, falseStatement).fromToken(ifToken);
	}
	
	readBlock(beginTokenText, endTokenText, endTokenSuffixText) {
		let beginToken = this.readToken();
		if (beginToken.text !== beginTokenText) {
			return ParserError.unexpectedToken(beginToken, beginTokenText);
		}
		let statementIndex = 0;
		let statements = [];
		let token = this.peekToken();
		while (token !== endTokenText) {
			let statement = this.readStatement();
			if (Parser.isError(statement)) {
				return statement;
			}
			statements[statementIndex] = statement;
			statementIndex++;			
			token = this.peekToken();
		}
		this.readToken();
		if (endTokenSuffixText !== null) {
			let endTokenSuffix = this.readToken();
			if (endTokenSuffix.text !== endTokenSuffixText) {
				return ParserError.unexpectedToken(endTokenSuffix, endTokenSuffixText);
			}
		}
		return new AstBlock(statementIndex, statements).fromToken(beginToken);
	}
	
	readWhile() {
		let whileToken = this.readToken();
		if (whileToken.text !== "while") {
			return ParserError.unexpectedToken(whileToken,  "while");
		}
		let condition = this.readExpression();
		if (Parser.isError(condition)) {
			return condition;
		}
		let statement = this.readBlock("loop", "end", "loop");
		if (Parser.isError(statement)) {
			return statement;
		}
		return new AstWhile(condition, statement).fromToken(whileToken);
	}
	
	readParameter() {
		let parameterName = this.readToken();
		if (!TokenReader.isIdentifier(parameterName.text)) {
			return ParserError.unexpectedToken(parameterName, "identifier")
		}
		let parameterType = this.readType();
		if (Parser.isError(parameterType)) {
			return parameterType;
		}
		return new AstParameter(parameterName.text, parameterType).fromToken(parameterName);	
	}

	readParameterList() {
		let openToken = this.readToken();
		if (openToken.text !== "(") {
			return ParserError.unexpectedToken(openToken, "(");
		}
		let parameters = [];
		let parameterIndex = 0;
		while (this.peekToken() !== ")") {
			if (parameterIndex > 0) {
				let sepToken = this.readToken();
				if (sepToken.text != ",") {
					return ParserError.unexpectedToken(sepToken, "}, ,");
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
		if (functionToken.text !== "function" && functionToken.text !== "generator") {
			return ParserError.unexpectedToken(functionToken,  "function or generator");
		}
		let isGenerator = functionToken.text === "generator";
		let functionName = this.readToken();
		if (!TokenReader.isIdentifier(functionName.text)) {
			return ParserError.unexpectedToken(functionName, "identifier")
		}
		let parameterList = this.readParameterList();
		if (Parser.isError(parameterList)) {
			return parameterList;
		}
		let returnType = this.readType();
		if (Parser.isError(returnType)) {
			return returnType;
		}
		let statement = this.readBlock("begin", "end", functionName.text);
		if (Parser.isError(statement)) {
			return statement;
		}
		return new AstFunctionDeclaration(functionName.text, parameterList, returnType, statement, isGenerator).fromToken(functionToken);
	}
	
	readProcedureDeclaration() {
		let procedureToken = this.readToken();
		if (procedureToken.text !== "procedure") {
			return ParserError.unexpectedToken(procedureToken,  "procedure");
		}
		let procedureName = this.readToken();
		if (!TokenReader.isIdentifier(procedureName.text)) {
			return ParserError.unexpectedToken(procedureName, "identifier")
		}
		let parameterList = this.readParameterList();
		if (Parser.isError(parameterList)) {
			return parameterList;
		}
		let statement = this.readBlock("begin", "end", procedureName.text);
		if (Parser.isError(statement)) {
			return statement;
		}
		return new AstProcedureDeclaration(procedureName.text, parameterList, statement).fromToken(procedureToken);
	}

	readReturn() {
		let retToken = this.readToken();
		if (retToken.text !== "return") {
			return ParserError.unexpectedToken(retToken, "return");
		}
		let expr = this.readExpression();
		if (Parser.isError(expr)) {
			return expr;
		}
		return new AstReturn(expr).fromToken(retToken);
	}
	
	readYield() {
		let yieldToken = this.readToken();
		if (yieldToken.text !== "yield") {
			return ParserError.unexpectedToken(yieldToken, "yield");
		}
		let expr = this.readExpression();
		if (Parser.isError(expr)) {
			return expr;
		}
		return new AstYield(expr).fromToken(yieldToken);
	}
	
	readArgList() {
		let openToken = this.readToken();
		if (openToken.text !== "(") {
			return ParserError.unexpectedToken(openToken, "(");
		}
		let args = [];
		let argIndex = 0;
		while (this.peekToken() !== ")") {
			if (argIndex > 0) {
				let sepToken = this.readToken();
				if (sepToken.text != ",") {
					return ParserError.unexpectedToken(sepToken, "}, ,");
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
		if (forToken.text !== "for") {
			return ParserError.unexpectedToken(forToken, "for");
		}
		let index = this.readToken();
		if (!TokenReader.isIdentifier(index.text)) {
			return ParserError.unexpectedToken(index, "identifier")
		}
		let inToken = this.readToken();
		if (inToken.text !== "in") {
			return ParserError.unexpectedToken(inToken, "in");
		}
		let isReverse = false;
		if (this.peekToken() === "reverse") {
			this.readToken();
			isReverse = true;
		}
		let sequence = this.readExpression();
		if (Parser.isError(sequence)) {
			return sequence;
		}
		if (this.peekToken() === "..") {
			let rangeToken = this.readToken();
			let upperBound = this.readExpression();
			if (Parser.isError(upperBound)) {
				return upperBound;
			}
			sequence = new AstRange(sequence, upperBound).fromToken(rangeToken);
		}
		let statement = this.readBlock("loop", "end", "loop");
		if (Parser.isError(statement)) {
			return statement;
		}
		return new AstFor(index.text, isReverse, sequence, statement).fromToken(forToken);
	}
}
