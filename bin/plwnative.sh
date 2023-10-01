#/bin/sh
PLW_HOME=`dirname $0`/..
COMPILED_FILE=$(mktemp)
${PLW_HOME}/bin/plwc.sh $1 $COMPILED_FILE && ${PLW_HOME}/bin/plw $COMPILED_FILE
