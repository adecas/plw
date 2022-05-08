"use strict";
/******************************************************************************************************************************************

	RefManager
	
	Manage chunks of memory with reference counting
	
	TODO:
	
	The RefManager should manage all resource that must be closed
	
		* pointer to allocated heap memory
		* file
		* sockets

******************************************************************************************************************************************/

class CountedRef {
	constructor(tag) {
		this.tag = tag;
		this.refCount = 1;
	}
}

class CountedRefExceptionHandler extends CountedRef {
	constructor(codeBlockId, ip, bp) {
		super("ref-exception-handler");
		this.codeBlockId = codeBlockId;
		this.ip = ip;
		this.bp = bp;
	}
}

class CountedRefObject extends CountedRef {
	constructor(refSize, totalSize, ptr) {
		super("ref-object");
		this.refSize = refSize;
		this.totalSize = totalSize;
		this.ptr = ptr;
	}
	
	isOffsetRef(offset) {
		return offset < this.refSize;
	}
}

class CountedRefFrame extends CountedRef {
	constructor(totalSize, ptr, mapPtr) {
		super("ref-frame");
		this.totalSize = totalSize;
		this.ptr = ptr;
		this.mapPtr = mapPtr;
	}
	
	resizeFrame(newSize) {
		for (let i = this.totalSize; i < newSize; i++) {
			this.ptr[i] = 0;
			this.mapPtr[i] = false;
		}
		this.totalSize = newSize;
	}
}

class CountedRefString extends CountedRef {
	constructor(str) {
		super("ref-string");
		this.str = str;
	}
}

class RefManagerError {
	constructor() {
		this.refId = -1;
		this.errorMsg = null;
	}
	
	invalidRefId(refId) {
		this.refId = refId;
		this.errorMsg = "invalid refId";
	}
	
	invalidRefType(refId) {
		this.refId = refId;
		this.errorMsg = "invalid ref type";
	}
	
	hasError() {
		return this.errorMsg !== null;
	}
}

class RefManager {

	constructor() {
		this.refs = [];
		this.refCount = 0;
		this.freeRefIds = [];
		this.freeRefIdCount = 0;
	}
	
	isValidRefId(refId) {
		return refId >= 0 && refId < this.refCount && this.refs[refId] !== null;
	}
	
	getRef(refId, refManError) {
		if (!this.isValidRefId(refId)) {
			refManError.invalidRefId(refId);
			return null;	
		}
		return this.refs[refId];
	}
	
	getRefOfType(refId, refType, refManError) {
		let ref = this.getRef(refId, refManError);
		if (refManError.hasError()) {
			return null;
		}
		if (ref.tag !== refType) {
			refManError.invalidRefType(refId);
			return null;
		}
		return ref;
	}
	
	createRefId() {
		let refId = -1;
		if (this.freeRefIdCount > 0) {
			refId = this.freeRefIds[this.freeRefIdCount - 1];
			this.freeRefIdCount--;
		} else {
			refId = this.refCount;
			this.refCount++;
		}
		return refId;
	}
	
	addRef(ref) {
		let refId = this.createRefId();
		this.refs[refId] = ref;
		return refId;
	}
	
	createString(str) {
		return this.addRef(new CountedRefString(str));
	}
	
	createObject(refSize, totalSize, ptr) {
		return this.addRef(new CountedRefObject(refSize, totalSize, ptr));
	}
	
	createFrame(totalSize, ptr, mapPtr) {
		return this.addRef(new CountedRefFrame(totalSize, ptr, mapPtr));
	}
	
	createExceptionHandler(codeBlockId, ip, bp) {
		return this.addRef(new CountedRefExceptionHandler(codeBlockId, ip, bp));
	}	
		
	destroyObject(ref, refManError) {
		for (let i = 0; i < ref.refSize; i++) {
			this.decRefCount(ref.ptr[i], refManError);
			if (refManError.hasError()) {
				return;
			}
		}
		ref.ptr = null
	}
	
	destroyFrame(ref, refManError) {
		for (let i = ref.totalSize - 1; i >= 0; i--) {
			if (ref.mapPtr[i] === true) {
				this.decRefCount(ref.ptr[i], refManError);
				if (refManError.hasError()) {
					return;
				}
			}
		}
		ref.ptr = null;
	}
	
	destroyString(ref) {
		ref.str = null;
	}
	
	destroyRef(ref, refManError) {
		if (ref.tag === "ref-object") { 
			this.destroyObject(ref, refManError);
		} else if (ref.tag === "ref-frame") {
			this.destroyFrame(ref, refManError);
		} else if (ref.tag === "ref-string") {
			this.destroyString(ref);
		}
	}
	
	incRefCount(refId, refManError) {
		if (!this.isValidRefId(refId)) {
			refManError.invalidRefId(refId);
			return;	
		}
		this.refs[refId].refCount++;
	}
	
	decRefCount(refId, refManError) {
		if (!this.isValidRefId(refId)) {
			refManError.invalidRefId(refId);
			return;	
		}
		let ref = this.refs[refId];
		ref.refCount--;
		if (ref.refCount === 0) {
			this.destroyRef(ref, refManError);
			if (refManError.hasError()) {
				return;
			}
			this.refs[refId] = null;
			this.freeRefIds[this.freeRefIdCount] = refId;
			this.freeRefIdCount++;
		}
		return;
	}
	
	compareRefs(refId1, refId2, refManError) {
		if (!this.isValidRefId(refId1)) {
			refManError.invalidRefId(refId1);
			return false;
		}
		if (!this.isValidRefId(refId2)) {
			refManError.invalidRefId(refId2);
			return false;
		}
		if (refId1 === refId2) {
			return true;
		}
		let ref1 = this.refs[refId1];
		let ref2 = this.refs[refId2];
		if (ref1.tag !== ref2.tag) {
			return false;
		}
		if (ref1.tag === "ref-string") {
			return ref1.str === ref2.str;
		}
		if (ref1.tag === "ref-object") {
			if (ref1.totalSize !== ref2.totalSize || ref1.refSize != ref2.refSize) {
				return false;
			}
			for (let i = 0; i < ref1.totalSize; i++) {
				if (i < ref1.refSize) {
					if (!this.compareRefs(ref1.ptr[i], ref2.ptr[i], refManError)) {
						return false;
					}
					if (refManError.hasError()) {
						return false;
					}
				} else {
					if (ref1.ptr[i] !== ref2.ptr[i]) {
						return false;
					}
				}
			}
			return true;
		}
		return false;
	}
	
	shallowCopy(refId, refManError) {
		if (!this.isValidRefId(refId)) {
			refManError.invalidRefId(refId);
			return -1;
		}
		let ref = this.refs[refId];
		if (ref.tag !== "ref-object") {
			refManError.cantCopyRef(refId);
		}
		let newPtr = [];
		for (let i = 0; i < ref.ptr.length; i++) {
			newPtr[i] = ref.ptr[i];
			if (i < ref.refSize) {
				this.incRefCount(newPtr[i], refManError);
				if (refManError.hasError()) {
					return -1;
				}
			}
		}
		return this.createObject(ref.refSize, ref.totalSize, newPtr);
	}
	
	makeMutable(refId, refManError) {
		if (!this.isValidRefId(refId)) {
			refManError.invalidRefId(refId);
			return false;
		}
		let ref = this.refs[refId];
		if (ref.refCount === 1) {
			return refId;
		}
		let newRefId = this.shallowCopy(refId, refManError);
		if (refManError.hasError()) {
			return -1;
		}
		ref.refCount--;
		return newRefId;
	}		

}

