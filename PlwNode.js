const fs = require("fs");
const stream = require("stream");

function addTextOut(txt) {
	process.stdout.write(txt);
}

function printTextOut(txt) {
	console.log(txt);
}

let compilerContext = new CompilerContext();
let nativeFunctionManager = NativeFunctionManager.initStdNativeFunctions(compilerContext);
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
		while (smRet !== null && smRet.errorMsg === "@get_char") {
			let buffer = new Int8Array(1);
	  		fs.readSync(0, buffer, 0, 1);
			stackMachine.stack[stackMachine.sp - 1] = buffer[0];
			stackMachine.stackMap[stackMachine.sp - 1] = false;
			smRet = stackMachine.runLoop();
		}
		if (smRet !== null) {
			console.log(JSON.stringify(smRet));
			console.log(JSON.stringify(stackMachine.codeBlocks[smRet.currentBlockId], undefined, 4));
			break;
		}
	}
}

console.log("done");


