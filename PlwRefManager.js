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

class CountedRefObject extends CountedRef {
	constructor(refSize, totalSize, ptr) {
		super("ref-object");
		this.refSize = refSize;
		this.totalSize = totalSize;
		this.ptr = ptr;
	}
}

class CountedRefFrame extends CountedRef {
	constructor(totalSize) {
		super("ref-frame");
		this.totalSize = totalSize;
		this.ptr = [];
		this.mapPtr = [];
		for (let i = 0; i < this.totalSize; i++) {
			this.ptr[i] = 0;
			this.mapPtr[i] = false;
		}		
	}
}

class CountedRefString extends CountedRef {
	constructor(str) {
		super("ref-string");
		this.str = str;
	}
}

class RefManager {

	constructor() {
		this.refs = [ null ];
		this.refCount = 1;
		this.freeRefIds = [];
		this.freeRefIdCount = 0;
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
	
	createString(str) {
		let refId = this.createRefId();
		this.refs[refId] = new CountedRefString(str);
		return refId;
	}
	
	stringStr(refId) {
		return this.refs[refId].str;
	}
	
	createObjectWithPtr(refSize, totalSize, ptr) {
		let refId = this.createRefId();
		this.refs[refId] = new CountedRefObject(refSize, totalSize, ptr);
		return refId;
	}
	
	createObject(refSize, totalSize) {
		let ptr = [];
		for (let i = 0; i < this.totalSize; i++) {
			this.ptr[i] = 0;
		}
		return this.createObjectWithPtr(refSize, totalSize, ptr);
	}
	
	createFrame(totalSize) {
		let refId = this.createRefId();
		this.refs[refId] = new CountedRefFrame(totalSize);
		return refId;
	}		
	
	resizeObject(refId, newSize) {
		let ref = this.refs[refId];
		if (newSize < ref.refSize) {
			newSize = ref.refSize;
		}
		for (let i = ref.totalSize; i < newSize; i++) {
			ref.ptr[i] = 0;
		}
		ref.totalSize = newSize;
	}
	
	resizeFrame(refId, newSize) {
		let ref = this.refs[refId];
		for (let i = ref.totalSize; i < newSize; i++) {
			ref.ptr[i] = 0;
			ref.mapPtr[i] = false;
		}
		ref.totalSize = newSize;
	}
	
	destroyObject(ref) {
		for (let i = 0; i < ref.refSize; i++) {
			if (ref.ptr[i] !== 0) {
				this.decRefCount(ref.ptr[i]);
			}
		}
		ref.ptr = null
	}
	
	destroyFrame(ref) {
		for (let i = ref.totalSize - 1; i >= 0; i--) {
			if (ref.mapPtr[i] === true) {
				this.decRefCount(ref.ptr[i]);
			}
		}
		ref.ptr = null;
	}
	
	destroyString(ref) {
		ref.str = null;
	}
	
	destroyRef(ref) {
		if (ref.tag === "ref-object") { 
			this.destroyObject(ref);
		} else if (ref.tag === "ref-frame") {
			this.destroyFrame(ref);
		} else if (ref.tag === "ref-string") {
			this.destroyString(ref);
		}
	}
	
	incRefCount(refId) {
		this.refs[refId].refCount++;
	}
	
	decRefCount(refId) {
		let ref = this.refs[refId];
		if (ref === null) {
			console.log("illegal decRefCount on refId " + refId);
		}
		ref.refCount--;
		if (ref.refCount === 0) {
			this.destroyRef(ref);
			this.refs[refId] = null;
			this.freeRefIds[this.freeRefIdCount] = refId;
			this.freeRefIdCount++;
		}
	}
	
	objectSize(refId) {
		return this.refs[refId].totalSize;
	}
	
	objectIsOffsetRef(refId, offset) {
		return offset < this.refs[refId].refSize;
	}
	
	frameSize(refId) {
		return this.refs[refId].totalSize;
	}

	objectPtr(refId) {
		return this.refs[refId].ptr;
	}
	
	framePtr(refId) {
		return this.refs[refId].ptr;
	}
	
	frameMapPtr(refId) {
		return this.refs[refId].mapPtr;
	}
	
	compareRefs(refId1, refId2) {
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
					if (!this.compareObjects(ref1.ptr[i], ref2.ptr[i])) {
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
	
	copyObject(srcIndex, srcOffset, srcLength, dstIndex, dstOffset) {
		let dstPtr = this.objectPtr(dstIndex);
		let srcPtr = this.objectPtr(srcIndex);
		for(let i = 0; i < srcLength; i++) {
			dstPtr[dstOffset + i] = srcPtr[srcOffset + i];
		}
	}

}

