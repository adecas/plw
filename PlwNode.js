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


