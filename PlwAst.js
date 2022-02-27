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
	constructor(fieldName, fieldType, valueExpr) {
		super("ast-value-record-field");
		this.fieldName = fieldName;
		this.fieldType = fieldType;
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
	constructor(varName, varType, valueExpr) {
		super("ast-variable-declaration");
		this.varName = varName;
		this.varType = varType;
		this.valueExpr = valueExpr;
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
	constructor(indexed, index) {
		super("ast-index");
		this.indexed = indexed;
		this.index = index;
	}
}

class AstBlock extends AstNode {
	constructor(statementCount, statements) {
		super("ast-block");
		this.statementCount = statementCount;
		this.statements = statements;
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
