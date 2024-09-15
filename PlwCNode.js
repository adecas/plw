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

let mergedCodeBlock = new MergedCodeBlock();
for (let i = 0; i < compilerContext.codeBlocks.length; i++) {
	mergedCodeBlock.addCodeBlock(compilerContext.codeBlocks[i]);
}
mergedCodeBlock.beginEntryPoint();
for (let i = 0; i < rootCodeBlocks.length; i++) {
	mergedCodeBlock.addCodeBlock(rootCodeBlocks[i]);
}
mergedCodeBlock.endMerge();

fs.writeFileSync(outFileName, mergedCodeBlock.compiledFormat());

