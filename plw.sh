#/bin/sh
PLW_HOME=`dirname $0`
cat \
${PLW_HOME}/PlwTokenReader.js \
${PLW_HOME}/PlwAst.js \
${PLW_HOME}/PlwParser.js \
${PLW_HOME}/PlwOpcodes.js \
${PLW_HOME}/PlwCompiler.js \
${PLW_HOME}/PlwRefManager.js \
${PLW_HOME}/PlwStackMachine.js \
${PLW_HOME}/PlwNativeFunctionManager.js \
${PLW_HOME}/PlwNode.js > PlwBundle.js
node -- PlwBundle.js $*
