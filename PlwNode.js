const fs = require("fs");
const stream = require("stream");

console.log("\u001b[;H\u001b[J");

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
		if (smRet !== null) {
			console.log(JSON.stringify(smRet));
		}
	}
}

