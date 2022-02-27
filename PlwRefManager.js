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
	constructor(refSize, totalSize) {
		super("ref-object");
		this.refSize = refSize;
		this.totalSize = totalSize;
		this.ptr = [];
		for (let i = 0; i < this.totalSize; i++) {
			this.ptr[i] = 0;
		}
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
	
	createObject(refSize, totalSize) {
		let refId = this.createRefId();
		this.refs[refId] = new CountedRefObject(refSize, totalSize);
		return refId;
	}
	
	createFrame(totalSize) {
		let refId = this.createRefId();
		this.refs[refId] = new CountedRefFrame(totalSize);
		return refId;
	}		

	createObjectFromString(str) {
		let refId = this.createObject(0, str.length);
		for (let i = 0; i < str.length; i++) {
			this.refs[refId].ptr[i] = str.charCodeAt(i);
		}
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
	
	destroyRef(ref) {
		if (ref.tag === "ref-object") { 
			this.destroyObject(ref);
		} else if (ref.tag === "ref-frame") {
			this.destroyFrame(ref);
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
	
	copyObject(srcIndex, srcOffset, srcLength, dstIndex, dstOffset) {
		let dstPtr = this.objectPtr(dstIndex);
		let srcPtr = this.objectPtr(srcIndex);
		for(let i = 0; i < srcLength; i++) {
			dstPtr[dstOffset + i] = srcPtr[srcOffset + i];
		}
	}

}

