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

