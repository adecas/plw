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

const PLW_TAG_REF_EXCEPTION_HANDLER = 1;
const PLW_TAG_REF_RECORD = 2;
const PLW_TAG_REF_MAPPED_RECORD = 3;
const PLW_TAG_REF_STRING = 4;
const PLW_TAG_REF_BASIC_ARRAY = 5;
const PLW_TAG_REF_ARRAY = 6;

const PLW_TAG_REF_NAMES = [
	"",
	"EXCEPTION_HANDLER",
	"RECORD",
	"MAPPED_RECORD",
	"STRING",
	"BASIC_ARRAY",
	"ARRAY"
];

class PlwRefManagerError {
	constructor() {
		this.refId = -1;
		this.refTag = -1;
		this.offset = -1;
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
	
	invalidRefTag(refTag) {
		this.refTag = refTag;
		this.errorMsg = "invalid ref tag";
	}
	
	invalidOffset(offset) {
		this.offset = offset;
		this.errorMsg = "invalid ref offset";
	}
	
	hasError() {
		return this.errorMsg !== null;
	}
}

class PlwOffsetValue {
	constructor(val, isRef) {
		this.val = val;
		this.isRef = isRef
	}
}

class PlwAbstractRef {
	constructor(tag) {
		this.tag = tag;
		this.refCount = 1;
	}
	
	getOffsetValue(refMan, offset, isForMutate, refManError) {
		refManError.invalidRefTag(this.tag);
		return null;
	}
	
	setOffsetValue(refMan, offset, val, refManError) {
		refManError.invalidRefTag(this.tag);
	}
	
	shallowCopy(refMan, refManError) {
		refManError.invalidRefTag(this.tag);
		return -1;
	}
	
	compareTo(refMan, ref, refManError) {
		refManError.invalidRefTag(this.tag);
		return false;
	}
	
	destroy(refMan, refManError) {
		refManError.invalidRefTag(this.tag);
	}
}

class PlwExceptionHandlerRef extends PlwAbstractRef {
	constructor(codeBlockId, ip, bp) {
		super(PLW_TAG_REF_EXCEPTION_HANDLER);
		this.codeBlockId = codeBlockId;
		this.ip = ip;
		this.bp = bp;
	}
	
	static make(refMan, codeBlockId, ip, bp) {
		return refMan.addRef(new PlwExceptionHandlerRef(codeBlockId, ip, bp));
	}			
	
	destroy(refMan, refManError) {
	}

}

class PlwRecordRef extends PlwAbstractRef {
	constructor(refSize, totalSize, ptr) {
		super(PLW_TAG_REF_RECORD);
		this.refSize = refSize;
		this.totalSize = totalSize;
		this.ptr = ptr;
	}
	
	static make(refMan, refSize, totalSize, ptr) {
		return refMan.addRef(new PlwRecordRef(refSize, totalSize, ptr));
	}
	
	getOffsetValue(refMan, offset, isForMutate, refManError) {
		if (offset < 0 || offset >= this.totalSize) {
			refManError.invalidRefOffset(offset);
			return null;
		}
		if (isForMutate === true) {
			this.ptr[offset] = refMan.makeMutable(this.ptr[offset], refManError);
			if (refManError.hasError()) {
				return null;
			}				
		}
		return new PlwOffsetValue(this.ptr[offset], offset < this.refSize);
	}
	
	setOffsetValue(refMan, offset, val, refManError) {
		if (offset < 0 || offset >= this.totalSize) {
			refManError.invalidRefOffset(offset);
			return;
		}
		if (offset < this.refSize) {
			refMan.decRefCount(this.ptr[offset], refManError);
			if (refManError.hasError()) {
				return;
			}
		}
		this.ptr[offset] = val;
	}
	
	shallowCopy(refMan, refManError) {
		let newPtr = [...this.ptr];
		for (let i = 0; i < this.refSize; i++) {
			refMan.incRefCount(newPtr[i], refManError);
			if (refManError.hasError()) {
				return -1;
			}
		}
		return PlwRecordRef.make(refMan, this.refSize, this.totalSize, newPtr);
	}
	
	compareTo(refMan, ref, refManError) {
		if (this.totalSize !== ref.totalSize || this.refSize !== ref.refSize) {
			return false;
		}
		for (let i = 0; i < this.totalSize; i++) {
			if (i < this.refSize) {
				if (!refMan.compareRefs(this.ptr[i], ref.ptr[i], refManError)) {
					return false;
				}
				if (refManError.hasError()) {
					return false;
				}
			} else {
				if (this.ptr[i] !== ref.ptr[i]) {
					return false;
				}
			}
		}
		return true;
	}

	destroy(refMan, refManError) {
		for (let i = 0; i < this.refSize; i++) {
			refMan.decRefCount(this.ptr[i], refManError);
			if (refManError.hasError()) {
				return;
			}
		}
		this.ptr = null
	}
	
}

class PlwBasicArrayRef extends PlwAbstractRef {
	constructor(arraySize, ptr) {
		super(PLW_TAG_REF_BASIC_ARRAY);
		this.arraySize = arraySize;
		this.ptr = ptr;
	}
	
	static make(refMan, arraySize, ptr) {
		return refMan.addRef(new PlwBasicArrayRef(arraySize, ptr));
	}
	
	getOffsetValue(refMan, offset, isForMutate, refManError) {
		if (offset < 0 || offset >= this.arraySize) {
			refManError.invalidOffset(offset);
			return null;
		}
		return new PlwOffsetValue(this.ptr[offset], false);
	}
	
	setOffsetValue(refMan, offset, val, refManError) {
		if (offset < 0 || offset >= this.arraySize) {
			refManError.invalidRefOffset(offset);
			return;
		}
		this.ptr[offset] = val;
	}
	
	shallowCopy(refMan, refManError) {
		return PlwBasicArrayRef.make(refMan, this.arraySize, [...this.ptr]);
	}
	
	compareTo(refMan, ref, refManError) {
		if (this.arraySize !== ref.arraySize) {
			return false;
		}
		for (let i = 0; i < this.arraySize; i++) {
			if (this.ptr[i] !== ref.ptr[i]) {
				return false;
			}
		}
		return true;
	}
	
	destroy(refMan, refManError) {
		this.ptr = null;
	}

}

class PlwArrayRef extends PlwAbstractRef {
	constructor(arraySize, ptr) {
		super(PLW_TAG_REF_ARRAY);
		this.arraySize = arraySize;
		this.ptr = ptr;
	}
	
	static make(refMan, arraySize, ptr) {
		return refMan.addRef(new PlwArrayRef(arraySize, ptr));
	}
	
	getOffsetValue(refMan, offset, isForMutate, refManError) {
		if (offset < 0 || offset >= this.arraySize) {
			refManError.invalidRefOffset(offset);
			return null;
		}
		if (isForMutate === true) {
			this.ptr[offset] = refMan.makeMutable(this.ptr[offset], refManError);
			if (refManError.hasError()) {
				return null;
			}				
		}
		return new PlwOffsetValue(this.ptr[offset], true);
	}
	
	setOffsetValue(refMan, offset, val, refManError) {
		if (offset < 0 || offset >= this.arraySize) {
			refManError.invalidRefOffset(offset);
			return;
		}
		refMan.decRefCount(this.ptr[offset], refManError);
		if (refManError.hasError()) {
			return;
		}
		this.ptr[offset] = val;
	}
	
	shallowCopy(refMan, refManError) {
		let newPtr = [...this.ptr];
		for (let i = 0; i < this.arraySize; i++) {
			refMan.incRefCount(newPtr[i], refManError);
			if (refManError.hasError()) {
				return -1;
			}
		}
		return PlwArrayRef.make(refMan, this.arraySize, newPtr);
	}
	
	compareTo(refMan, ref, refManError) {
		if (this.arraySize !== ref.arraySize) {
			return false;
		}
		for (let i = 0; i < this.arraySize; i++) {
			if (!refMan.compareRefs(this.ptr[i], ref.ptr[i], refManError)) {
				return false;
			}
			if (refManError.hasError()) {
				return false;
			}
		}
		return true;
	}

	destroy(refMan, refManError) {
		for (let i = 0; i < this.arraySize; i++) {
			refMan.decRefCount(this.ptr[i], refManError);
			if (refManError.hasError()) {
				return;
			}
		}
		this.ptr = null
	}

}

class PlwMappedRecordRef extends PlwAbstractRef {
	constructor(totalSize, ptr, mapPtr) {
		super(PLW_TAG_REF_MAPPED_RECORD);
		this.totalSize = totalSize;
		this.ptr = ptr;
		this.mapPtr = mapPtr;
	}
	
	static make(refMan, totalSize, ptr, mapPtr) {
		return refMan.addRef(new PlwMappedRecordRef(totalSize, ptr, mapPtr));
	}
	
	resizeFrame(newSize) {
		for (let i = this.totalSize; i < newSize; i++) {
			this.ptr[i] = 0;
			this.mapPtr[i] = false;
		}
		this.totalSize = newSize;
	}
	
	destroy(refMan, refManError) {
		for (let i = this.totalSize - 1; i >= 0; i--) {
			if (this.mapPtr[i] === true) {
				refMan.decRefCount(this.ptr[i], refManError);
				if (refManError.hasError()) {
					return;
				}
			}
		}
		this.ptr = null;
	}
	
}

class PlwStringRef extends PlwAbstractRef {
	constructor(str) {
		super(PLW_TAG_REF_STRING);
		this.str = str;
	}
	
	static make(refMan, str) {
		return refMan.addRef(new PlwStringRef(str));
	}
	
	compareTo(refMan, ref, refManError) {
		return this.str === ref.str;
	}
	
	destroy(refMan, refManError) {
		this.str = null;
	}
}


class PlwRefManager {

	constructor() {
		this.refs = [];
		this.refCount = 0;
		this.freeRefIds = [];
		this.freeRefIdCount = 0;
	}
	
	isValidRefId(refId) {
		return refId >= 0 && refId < this.refCount && this.refs[refId] !== -1;
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
			ref.destroy(this, refManError);
			if (refManError.hasError()) {
				return;
			}
			this.refs[refId] = -1;
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
		return ref1.compareTo(this, ref2, refManError);
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
		let newRefId = ref.shallowCopy(this, refManError);
		if (refManError.hasError()) {
			return -1;
		}
		ref.refCount--;
		return newRefId;
	}
	
	setOffsetValue(refId, offset, val, refManError) {
		let ref = this.getRef(refId, refManError);
		if (refManError.hasError()) {
			return;
		}
		ref.setOffsetValue(this, offset, val, refManError);
	}
	
	getOffsetValue(refId, offset, isForMutate, refManError) {
		let ref = this.getRef(refId, refManError);
		if (refManError.hasError()) {
			return null;
		}
		return ref.getOffsetValue(this, offset, isForMutate, refManError);
	}

}

