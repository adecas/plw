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

const TAG_REF_EXCEPTION_HANDLER = 1;
const TAG_REF_OBJECT = 2;
const TAG_REF_FRAME = 3;
const TAG_REF_STRING = 4;
const TAG_REF_PRIMARRAY = 5;

class CountedRef {
	constructor(tag) {
		this.tag = tag;
		this.refCount = 1;
	}
}

class CountedRefExceptionHandler extends CountedRef {
	constructor(codeBlockId, ip, bp) {
		super(TAG_REF_EXCEPTION_HANDLER);
		this.codeBlockId = codeBlockId;
		this.ip = ip;
		this.bp = bp;
	}
}

class CountedRefObject extends CountedRef {
	constructor(refSize, totalSize, ptr) {
		super(TAG_REF_OBJECT);
		this.refSize = refSize;
		this.totalSize = totalSize;
		this.ptr = ptr;
	}
	
	isOffsetRef(offset) {
		return offset < this.refSize;
	}
}

class CountedRefPrimarray extends CountedRef {
	constructor(arraySize, ptr) {
		super(TAG_REF_PRIMARRAY);
		this.arraySize = arraySize;
		this.ptr = ptr;
	}
}

class CountedRefFrame extends CountedRef {
	constructor(totalSize, ptr, mapPtr) {
		super(TAG_REF_FRAME);
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
		super(TAG_REF_STRING);
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
	
	createPrimarray(arraySize, ptr) {
		return this.addRef(new CountedRefPrimarray(arraySize, ptr));
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
		if (ref.tag === TAG_REF_OBJECT) { 
			this.destroyObject(ref, refManError);
		} else if (ref.tag === TAG_REF_FRAME) {
			this.destroyFrame(ref, refManError);
		} else if (ref.tag === TAG_REF_STRING) {
			this.destroyString(ref);
		} else if (ref.tag === TAG_REF_PRIMARRAY || TAG_REF_EXCEPTION_HANDLER) {
			// nothing to do
		} else {
			// TODO have a more meaningful error
			refManError.invalidRefType(-1);
		}
	}
	
	incRefCount(refId, refManError) {
		if (!this.isValidRefId(refId)) {
			refManError.invalidRefId(refId);
			return;	
		}
		this.refs[refId].refCount++;
	}
	
	addRefCount(refId, count, refManError) {
		if (!this.isValidRefId(refId)) {
			refManError.invalidRefId(refId);
			return;	
		}
		this.refs[refId].refCount += count;
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
		if (ref1.tag === TAG_REF_STRING) {
			return ref1.str === ref2.str;
		}
		if (ref1.tag === TAG_REF_PRIMARRAY) {
			if (ref1.arraySize !== ref2.arraySize) {
				return false;
			}
			for (let i = 0; i < ref1.arraySize; i++) {
				if (ref1.ptr[i] !== ref2.ptr[i]) {
					return false;
				}
			}
			return true;
		}
		if (ref1.tag === TAG_REF_OBJECT) {
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
		if (ref.tag === TAG_REF_OBJECT) {
			let newPtr = new Array(ref.totalSize);
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
		if (ref.tag === TAG_REF_PRIMARRAY) {
			return this.createPrimarray(ref.arraySize, [...ref.ptr]);
		}
		refManError.cantCopyRef(refId);
		return -1;
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

