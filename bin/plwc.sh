#/bin/sh
PLW_HOME=`dirname $0`/..
cat \
${PLW_HOME}/PlwTokenReader.js \
${PLW_HOME}/PlwAst.js \
${PLW_HOME}/PlwParser.js \
${PLW_HOME}/PlwOpcodes.js \
${PLW_HOME}/PlwLangOpcodes.js \
${PLW_HOME}/PlwCodeBlock.js \
${PLW_HOME}/PlwCompiler.js \
${PLW_HOME}/PlwRefManager.js \
${PLW_HOME}/PlwStackMachine.js \
${PLW_HOME}/PlwLangOps.js \
${PLW_HOME}/PlwNativeFunctionManager.js \
${PLW_HOME}/PlwCNode.js > ${PLW_HOME}/PlwCBundle.js
node -- ${PLW_HOME}/PlwCBundle.js $*
