"use strict";

let PLW_LOPS = [];

/* create_string(stringId integer)
 */
PLW_LOPS[PLW_LOPCODE_CREATE_STRING] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let strId = sm.stack[sm.sp - 1];
	if (strId < 0 || strId >= sm.codeBlocks[sm.codeBlockId].strConsts.length) {
		return StackMachineError.constAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);						
	}
	let str = sm.codeBlocks[sm.codeBlockId].strConsts[strId];
	sm.stack[sm.sp - 1] = PlwStringRef.make(sm.refMan, str);
	sm.stackMap[sm.sp - 1] = true;
	return null;
}


/* concat_string(items ...String, itemCount integer)
 */
PLW_LOPS[PLW_LOPCODE_CONCAT_STRING] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let itemCount = sm.stack[sm.sp - 1];
	if (itemCount < 0 || sm.sp < itemCount + 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let strs = new Array(itemCount);
	for (let i = 0; i < itemCount; i++) {
		let refId = sm.stack[sm.sp - itemCount - 1 + i];
		let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_STRING, sm.refManError);
		if (sm.hasRefManError()) {
			return sm.errorFromRefMan();
		}
		strs[i] = ref.str;
	}
	let resultRefId = PlwStringRef.make(sm.refMan, strs.join(""));
	for (let i = 0; i < itemCount; i++) {
		let refId = sm.stack[sm.sp - itemCount - 1 + i];
		sm.refMan.decRefCount(refId, sm.refManError);
		if (sm.hasRefManError()) {
			return sm.errorFromRefMan();
		}
	}
	sm.stack[sm.sp - itemCount - 1] = resultRefId;
	sm.stackMap[sm.sp - itemCount - 1] = true;
	sm.sp -= itemCount;
	return null;
}

/* create_blob(item ...integer, blobSize integer)
 */
PLW_LOPS[PLW_LOPCODE_CREATE_BLOB] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let blobSize = sm.stack[sm.sp - 1];
	if (blobSize < 0 || sm.sp < 1 + blobSize) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let ptr = sm.stack.slice(sm.sp - 1 - blobSize, sm.sp - 1);
	let mapPtr = sm.stackMap.slice(sm.sp - 1 - blobSize, sm.sp - 1);
	let refId = PlwBlobRef.make(sm.refMan, blobSize, ptr, mapPtr);
	sm.sp -= blobSize;
	sm.stack[sm.sp - 1] = refId; 
	sm.stackMap[sm.sp - 1] = true;
	return null;
}

/* read_blob(refId Blob, offset integer, size integer)
 */
PLW_LOPS[PLW_LOPCODE_READ_BLOB] = function(sm) {
	if (sm.sp < 3) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let size = sm.stack[sm.sp - 1];
	let offset = sm.stack[sm.sp - 2];
	let refId = sm.stack[sm.sp - 3];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	if (offset < 0 || size < 0 || offset + size > ref.blobSize) {
		return StackMachineError.refAccessOutOfBound();
	}
	sm.sp += size - 3;
	for (let i = 0; i < size; i++) {
		let value = ref.ptr[offset + i];
		let valueIsRef = ref.mapPtr[offset + i];
		sm.stack[sm.sp - size + i] = value;
		sm.stackMap[sm.sp - size + i] = valueIsRef;
		if (valueIsRef) {
			sm.refMan.incRefCount(value, sm.refManError);
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
		}
	}
	sm.refMan.decRefCount(refId, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	return null;
}

/* write_blob(refId Blob, offset integer, val ...integer, size integer)
 */
PLW_LOPS[PLW_LOPCODE_WRITE_BLOB] = function(sm) {
	if (sm.sp < 3) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let size = sm.stack[sm.sp - 1];
	if (size < 0 || sm.sp < 3 + size) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let offset = sm.stack[sm.sp - 2 - size];
	let refId = sm.stack[sm.sp - 3 - size];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	if (offset < 0 || offset + size > ref.blobSize) {
		return StackMachineError.refAccessOutOfBound();
	}
	for (let i = 0; i < size; i++) {
		if (ref.mapPtr[offset + i] === true) {
			sm.refMan.decRefCount(ref.ptr[offset + i], sm.refManError);
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
		}
		ref.ptr[offset + i] = sm.stack[sm.sp - 1 - size + i];
		ref.mapPtr[offset + i] = sm.stackMap[sm.sp - 1 - size + i];
	}
	sm.refMan.decRefCount(refId, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	sm.sp -= 3 + size;
	return null;
}

/* concat_blob(blob ...Blob, itemCount integer)
 */
PLW_LOPS[PLW_LOPCODE_CONCAT_BLOB] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let itemCount = sm.stack[sm.sp - 1];
	if (itemCount < 0 || sm.sp < itemCount + 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let ptrs = new Array(itemCount);
	let mapPtrs = new Array(itemCount);
	let blobSize = 0;
	for (let i = 0; i < itemCount; i++) {
		let refId = sm.stack[sm.sp - itemCount - 1 + i];
		let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
		if (sm.hasRefManError()) {
			return sm.errorFromRefMan();
		}
		ptrs[i] = ref.ptr;
		mapPtrs[i] = ref.mapPtr;
		blobSize += ref.blobSize;
	}
	let ptr = [].concat(...ptrs);
	let mapPtr = [].concat(...mapPtrs);
	for(let i = 0; i < blobSize; i++) {
		if (mapPtr[i] === true) {
			sm.refMan.incRefCount(ptr[i], sm.refManError);
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
		}
	}
	let resultRefId = PlwBlobRef.make(sm.refMan, blobSize, ptr, mapPtr);
	for (let i = 0; i < itemCount; i++) {
		let refId = sm.stack[sm.sp - itemCount - 1 + i];
		sm.refMan.decRefCount(refId, sm.refManError);
		if (sm.hasRefManError()) {
			return sm.errorFromRefMan();
		}
	}
	sm.stack[sm.sp - itemCount - 1] = resultRefId;
	sm.stackMap[sm.sp - itemCount - 1] = true;
	sm.sp -= itemCount;
	return null;
}

/* append_blob_item(blob Blob, val ...integer, size integer)
 */
PLW_LOPS[PLW_LOPCODE_APPEND_BLOB_ITEM] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let size = sm.stack[sm.sp - 1];
	if (size < 0 || sm.sp < 2 + size) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let refId = sm.stack[sm.sp - 2 - size];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	if (ref.refCount === 1) {
		for (let i = 0; i < size; i++) {
			ref.ptr[ref.blobSize + i] = sm.stack[sm.sp - 1 - size + i];
			ref.mapPtr[ref.blobSize + i] = sm.stackMap[sm.sp - 1 - size + i];
		}
		ref.blobSize += size;
		sm.sp -= size + 1;
		return null;
	}
	let ptr = ref.ptr.concat(sm.stack.slice(sm.sp - 1 - size, sm.sp - 1));
	let mapPtr = ref.mapPtr.concat(sm.stackMap.slice(sm.sp - 1 - size, sm.sp - 1));
	let blobSize = ref.blobSize + size;
	for(let i = 0; i < ref.blobSize; i++) {
		if (mapPtr[i] === true) {
			sm.refMan.incRefCount(ptr[i], sm.refManError);
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
		}
	}
	sm.refMan.decRefCount(refId, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	let resultRefId = PlwBlobRef.make(sm.refMan, blobSize, ptr, mapPtr);
	sm.stack[sm.sp - 2 - size] = resultRefId;
	sm.stackMap[sm.sp - 2 - size] = true;
	sm.sp -= 1 + size;
	return null;
}

/* get_blob_mutable_offset(refId Blob, offset integer)
 */
PLW_LOPS[PLW_LOPCODE_GET_BLOB_MUTABLE_OFFSET] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let offset = sm.stack[sm.sp - 1];
	let refId = sm.stack[sm.sp - 2];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	if (offset < 0 || offset >= ref.blobSize || ref.mapPtr[offset] === false) {
		return StackMachineError.refAccessOutOfBound();
	}
	let value = sm.refMan.makeMutable(ref.ptr[offset], sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	ref.ptr[offset] = value;
	sm.refMan.incRefCount(value, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	sm.refMan.decRefCount(refId, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	sm.stack[sm.sp - 2] = value;
	sm.stackMap[sm.sp - 2] = true;
	sm.sp--;
	return null;
}

/* get_blob_size(refId Blob)
 */
PLW_LOPS[PLW_LOPCODE_GET_BLOB_SIZE] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let refId = sm.stack[sm.sp - 1];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	let blobSize = ref.blobSize;
	sm.refMan.decRefCount(refId, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	sm.stack[sm.sp - 1] = blobSize;
	sm.stackMap[sm.sp - 1] = false;
	return null;
}

/* get_blob_index_of_item(item ...integer, refId Blob, itemSize integer)
 */
PLW_LOPS[PLW_LOPCODE_GET_BLOB_INDEX_OF_ITEM] = function(sm) {
	if (sm.sp < 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let itemSize = sm.stack[sm.sp - 1];
	if (itemSize < 1 && sm.sp < 2 + itemSize) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let refId = sm.stack[sm.sp - 2];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	let indexOf = -1;	
	let baseOffset = sm.sp - 2 - itemSize;
	let ptrOffset = 0;
	for (let i = 0; i < ref.blobSize / itemSize; i++) {
		let isItemEqual = true;
		for (let k = 0; k < itemSize; k++) {
			isItemEqual = ref.mapPtr[k] === true ?
				sm.refMan.compareRefs(sm.stack[baseOffset + k], ref.ptr[ptrOffset + k], sm.refManError) :
				sm.stack[baseOffset + k] === ref.ptr[ptrOffset + k];
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
			if (isItemEqual === false) {
				break;
			}
		}
		if (isItemEqual === true) {
			indexOf = i;
			break;
		}
		ptrOffset += itemSize;
	}
	sm.refMan.decRefCount(refId, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	for (let i = itemSize - 1; i >= 0; i--) {
		if (sm.stackMap[baseOffset + i] === true) {
			sm.refMan.decRefCount(sm.stack[baseOffset + i], sm.refManError);
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
		}
	}
	sm.stack[baseOffset] = indexOf;
	sm.stackMap[baseOffset] = false;
	sm.sp = baseOffset + 1;
	return null;
};

/* slice_blob(refId Blob, beginIndex integer, endIndex integer)
 */
PLW_LOPS[PLW_LOPCODE_SLICE_BLOB] = function(sm) {
	if (sm.sp < 3) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let refId = sm.stack[sm.sp - 3];
	let beginIndex = sm.stack[sm.sp - 2];
	let endIndex = sm.stack[sm.sp - 1];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	if (beginIndex < 0) {
		beginIndex = 0;
	}
	if (endIndex > ref.blobSize) {
		endIndex = ref.blobSize;
	}
	if (endIndex < beginIndex) {
		endIndex = beginIndex;
	}
	let blobSize = endIndex - beginIndex;
	let ptr = ref.ptr.slice(beginIndex, endIndex);
	let mapPtr = ref.mapPtr.slice(beginIndex, endIndex);
	for (let i = 0; i < blobSize; i++) {
		if (mapPtr[i] === true) {
			sm.refMan.incRefCount(ptr[i], sm.refManError);
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
		}
	}
	let resultRefId = PlwBlobRef.make(sm.refMan, blobSize, ptr, mapPtr);
	sm.refMan.decRefCount(refId, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	sm.stack[sm.sp - 3] = resultRefId;
	sm.stackMap[sm.sp - 3] = true;
	sm.sp -= 2;
	return null;
};

/* create_blob_repeat_item(item ...integer, itemCount integer, itemSize integer)
 */
PLW_LOPS[PLW_LOPCODE_CREATE_BLOB_REPEAT_ITEM] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let itemSize = sm.stack[sm.sp - 1];
	if (itemSize < 0 || sm.sp < 2 + itemSize) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let itemCount = sm.stack[sm.sp - 2];
	if (itemCount < 0) {
		itemCount = 0;
	}
	let blobSize = itemCount * itemSize;
	let ptr = new Array(blobSize);
	let mapPtr = new Array(blobSize);
	let baseOffset = sm.sp - 2 - itemSize;
	for (let i = 0; i < itemSize; i++) {
		ptr[i] = sm.stack[baseOffset + i];
		mapPtr[i] = sm.stackMap[baseOffset + i];
	}
	for (let i = itemSize; i < blobSize; i++) {
		ptr[i] = sm.stack[baseOffset + i % itemSize];
		mapPtr[i] = sm.stackMap[baseOffset + i % itemSize];
		if (mapPtr[i] === true) {
			sm.refMan.incRefCount(ptr[i], sm.refManError);
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
		}
	}
	let refId = PlwBlobRef.make(sm.refMan, blobSize, ptr, mapPtr);
	sm.stack[baseOffset] = refId; 
	sm.stackMap[baseOffset] = true;
	sm.sp = baseOffset + 1;
	return null;
}


/* create_exception_handler(offset integer)
 */
PLW_LOPS[PLW_LOPCODE_CREATE_EXCEPTION_HANDLER] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let offset = sm.stack[sm.sp - 1];
	sm.stack[sm.sp - 1] = PlwExceptionHandlerRef.make(sm.refMan, sm.codeBlockId, offset, sm.bp);
	sm.stackMap[sm.sp - 1] = true;
	return null;
}

/* raise_exception(errorCode integer)
 */
PLW_LOPS[PLW_LOPCODE_RAISE_EXCEPTION] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let errorCode = sm.stack[sm.sp - 1];
	while (sm.sp > 0) {
		if (sm.stackMap[sm.sp - 1] === true) {
			let refId = sm.stack[sm.sp - 1];
			let ref = sm.refMan.getRef(refId, sm.refManError);
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
			if (ref.tag === PLW_TAG_REF_EXCEPTION_HANDLER) {
				sm.bp = ref.bp;
				sm.ip = ref.ip;
				sm.codeBlockId = ref.codeBlockId;
				sm.refMan.decRefCount(refId, sm.refManError);
				if (sm.hasRefManError()) {
					return sm.errorFromRefMan();
				}
				sm.stack[sm.sp - 1] = errorCode;
				sm.stackMap[sm.sp - 1] = false;
				return null;
			}
			sm.refMan.decRefCount(refId, sm.refManError);
			if (sm.hasRefManError()) {
				return sm.errorFromRefMan();
			}
		}
		sm.sp--;
	}
	return StackMachineError.exception(errorCode).fromCode(sm.codeBlockId, sm.ip);
}

/* create_generator(param ...integer, paramCount integer, codeBlockId integer)
 * layout of the created blob is:
 *     0:   codeBlockId
 *     1:   ip
 *     2:   param1
 *     1+n: paramN
 */
PLW_LOPS[PLW_LOPCODE_CREATE_GENERATOR] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let codeBlockId = sm.stack[sm.sp - 1]
	let paramCount = sm.stack[sm.sp - 2];
	if (paramCount < 0 || sm.sp < paramCount + 2) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}					
	let ptr = new Array(paramCount + 2);
	let mapPtr = new Array(paramCount + 2);
	ptr[0] = codeBlockId;
	ptr[1] = 0;
	mapPtr[0] = false;
	mapPtr[1] = false;
	for (let i = 0; i < paramCount; i++) {
		ptr[i + 2] = sm.stack[sm.sp - paramCount - 2 + i];
		mapPtr[i + 2] = sm.stackMap[sm.sp - paramCount - 2 + i];
	}
	let refId = PlwBlobRef.make(sm.refMan, paramCount + 2, ptr, mapPtr);
	sm.stack[sm.sp - paramCount - 2] = refId;
	sm.stackMap[sm.sp - paramCount - 2] = true;
	sm.sp -= paramCount + 1;
	return null;	
}

/* get_generator_next_item(refId Generator)
 *
 * make the stack like this:
 *      refId			 parameter already on the stack
 *		oldCodeBlockId
 *      oldIp
 *      oldBp
 *   bp param1			 this and below copied from the generator blob
 *      ...
 *      paramN
 *      local1
 *      ...
 *      localN   
 */
PLW_LOPS[PLW_LOPCODE_GET_GENERATOR_NEXT_ITEM] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let refId = sm.stack[sm.sp - 1];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	if (ref.blobSize < 2) {
		return StackMachineError.refAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.stack[sm.sp] = sm.codeBlockId;
	sm.stackMap[sm.sp] = false;
	sm.sp++;
	sm.stack[sm.sp] = sm.ip;
	sm.stackMap[sm.sp] = false;
	sm.sp++;
	sm.stack[sm.sp] = sm.bp;
	sm.stackMap[sm.sp] = false;
	sm.sp++;
	sm.bp = sm.sp;
	for (let i = 0; i < ref.blobSize - 2; i++) {
		sm.stack[sm.sp] = ref.ptr[i + 2];
		sm.stackMap[sm.sp] = ref.mapPtr[i + 2];
		ref.mapPtr[i + 2] = false;
		sm.sp++;
	}
	let codeBlockId = ref.ptr[0];
	let ip = ref.ptr[1];
	if (codeBlockId < 0 || codeBlockId >= sm.codeBlocks.length) {
		return StackMachineError.codeAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	if (ip < 0 || ip > sm.codeBlocks[codeBlockId].codeSize) {
		return StackMachineError.codeAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	sm.codeBlockId = codeBlockId;
	sm.ip = ip;
	return null;
}

/* has_generator_ended(refId Generator)
 */
PLW_LOPS[PLW_LOPCODE_HAS_GENERATOR_ENDED] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let refId = sm.stack[sm.sp - 1];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	if (ref.blobSize < 2) {
		return StackMachineError.refAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let codeBlockId = ref.ptr[0];
	if (codeBlockId < 0 || codeBlockId >= sm.codeBlocks.length) {
		return StackMachineError.codeAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let ended = ref.ptr[1] >= sm.codeBlocks[codeBlockId].codeSize ? 1 : 0;
	sm.refMan.decRefCount(sm.stack[sm.sp - 1], sm.refManError);
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	sm.stack[sm.sp - 1] = ended;
	sm.stackMap[sm.sp - 1] = false;
	return null;
}

/* yield_generator_item(item ...integer, itemSize)
 * 
 * in a generator, the stack is like this:
 *      refId			 refId of the generator
 *		oldCodeBlockId
 *      oldIp
 *      oldBp
 *   bp param1			 this and below copied from the generator blob
 *      ...
 *      paramN
 *      local1
 *      ...
 *      localN   
 */
PLW_LOPS[PLW_LOPCODE_YIELD_GENERATOR_ITEM] = function(sm) {
	if (sm.sp < 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let itemSize = sm.stack[sm.sp - 1];
	if (sm.bp < 4 || itemSize < 0 || sm.sp < sm.bp + itemSize + 1) {
		return StackMachineError.stackAccessOutOfBound().fromCode(sm.codeBlockId, sm.ip);
	}
	let refId = sm.stack[sm.bp - 4];
	let ref = sm.refMan.getRefOfType(refId, PLW_TAG_REF_BLOB, sm.refManError);
	if (sm.refManError.hasError()) {
		return StackMachineError.referenceManagerError(sm.refManError).fromCode(sm.codeBlockId, sm.ip);
	}
	ref.resize(2 + (sm.sp - sm.bp) - itemSize - 1);
	ref.ptr[1] = sm.ip;
	for (let i = 0; i < sm.sp - sm.bp - itemSize - 1; i++) {
		ref.ptr[i + 2] = sm.stack[sm.bp + i];
		ref.mapPtr[i + 2] = sm.stackMap[sm.bp + i];
	}
	let previousBp = sm.stack[sm.bp - 1];
	let previousIp = sm.stack[sm.bp - 2];
	let previousCodeBlockId = sm.stack[sm.bp - 3];
	for (let i = 0; i < itemSize; i++) {
		sm.stack[sm.bp - 4 + i] = sm.stack[sm.sp - itemSize - 1 + i];
		sm.stackMap[sm.bp - 4 + i] = sm.stackMap[sm.sp - itemSize - 1 + i];
	}
	sm.sp = sm.bp - 4 + itemSize;
	sm.bp = previousBp;
	sm.codeBlockId = previousCodeBlockId;
	sm.ip = previousIp;
	sm.refMan.decRefCount(refId, sm.refManError);		
	if (sm.hasRefManError()) {
		return sm.errorFromRefMan();
	}
	return null;
}

