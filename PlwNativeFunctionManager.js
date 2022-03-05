class NativeFunctionManager {
	constructor() {
		this.functions = [];
		this.functionCount = 0;
	}
	
	addFunction(f) {
		let i = this.functionCount;
		this.functions[i] = f;
		this.functionCount++;
		return i;
	}
	
	static initStdNativeFunctions(compilerContext) {
		let nativeFunctionManager = new NativeFunctionManager();
		
		compilerContext.addProcedure(EvalResultProcedure.fromNative(
			"debug",
			new EvalResultParameterList(0, []),
			nativeFunctionManager.addFunction(function(sm) {
				console.log(sm);
			})
		));


		compilerContext.addProcedure(EvalResultProcedure.fromNative(
			"print",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			nativeFunctionManager.addFunction(function(sm) {
				let t = sm.stack[sm.sp - 2];
				printTextOut(String.fromCharCode(...sm.refMan.objectPtr(t)));
				sm.refMan.decRefCount(t);
				sm.sp -= 2;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"print",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_TEXT)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				let t = sm.stack[sm.sp - 2];
				printTextOut(String.fromCharCode(...sm.refMan.objectPtr(t)));
				sm.sp -= 1;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_INTEGER)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				sm.stack[sm.sp - 2] = sm.refMan.createObjectFromString("" + sm.stack[sm.sp - 2]);
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", EVAL_TYPE_BOOLEAN)]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				sm.stack[sm.sp - 2] = sm.refMan.createObjectFromString(sm.stack[sm.sp - 2] === 1 ? "true" : "false");
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
			})
		));


		compilerContext.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compilerContext.addType(new EvalTypeArray(EVAL_TYPE_INTEGER)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				let refId = sm.stack[sm.sp - 2];
				let ptr = sm.refMan.objectPtr(refId);
				let resultId = sm.refMan.createObjectFromString("[" + ptr + "]");
				sm.refMan.decRefCount(refId);
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"text",
			new EvalResultParameterList(1, [new EvalResultParameter("t", compilerContext.addType(new EvalTypeArray(EVAL_TYPE_TEXT)))]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				let refId = sm.stack[sm.sp - 2];
				let ptr = sm.refMan.objectPtr(refId);
				let len = sm.refMan.objectSize(refId);
				let str = "[";
				for (let i = 0; i < len; i++) {
					str += (i > 0 ? ", " : "") + String.fromCharCode(...sm.refMan.objectPtr(ptr[i]));
				}
				str += "]";
				let resultId = sm.refMan.createObjectFromString(str);
				sm.refMan.decRefCount(refId);
				sm.stack[sm.sp - 2] = resultId;
				sm.stackMap[sm.sp - 2] = true;
				sm.sp -= 1;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"array",
			new EvalResultParameterList(2, [
				new EvalResultParameter("val", EVAL_TYPE_INTEGER),
				new EvalResultParameter("count", EVAL_TYPE_INTEGER)
			]),
			compilerContext.addType(new EvalTypeArray(EVAL_TYPE_INTEGER)),
			nativeFunctionManager.addFunction(function(sm) {
				let val = sm.stack[sm.sp - 3];
				let count = sm.stack[sm.sp - 2]; 
				let r = sm.refMan.createObject(0, count);
				for (let i = 0; i < count; i++) {
					sm.refMan.objectPtr(r)[i] = val;
				}
				sm.stack[sm.sp - 3] = r;
				sm.stackMap[sm.sp - 3] = true;
				sm.sp -= 2;
			})
		));

		compilerContext.addFunction(EvalResultFunction.fromNative(
			"concat",
			new EvalResultParameterList(2, [
				new EvalResultParameter("t1", EVAL_TYPE_TEXT),
				new EvalResultParameter("t2", EVAL_TYPE_TEXT)
			]),
			EVAL_TYPE_TEXT,
			nativeFunctionManager.addFunction(function(sm) {
				let t1 = sm.stack[sm.sp - 3];
				let t2 = sm.stack[sm.sp - 2];
				let s1 = sm.refMan.objectSize(t1);
				let s2 = sm.refMan.objectSize(t2);
				let r = sm.refMan.createObject(0, s1 + s2);
				sm.refMan.copyObject(t1, 0, s1, r, 0);
				sm.refMan.copyObject(t2, 0, s2, r, s1);
				sm.refMan.decRefCount(t1);
				sm.refMan.decRefCount(t2);
				sm.stack[sm.sp - 3] = r;
				sm.stackMap[sm.sp - 3] = true;
				sm.sp -= 2;
			})
		));	
		
		return nativeFunctionManager;
	}
}

