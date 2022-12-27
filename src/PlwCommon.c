#include "PlwCommon.h"

#include <stdio.h>
#include <string.h>

const char *PlwErrorOutOfMem = "OutOfMem";

void *PlwAlloc(size_t size, PlwError *error) {
	void *m = malloc(size);
	if (m == NULL) {
		error->code = PlwErrorOutOfMem;
		snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Can't alloc %ld bytes", size);
	}
	return m;
}

void PlwFree(void *ptr) {
	free(ptr);
}

void *PlwRealloc(void *ptr, size_t size, PlwError *error) {
	void *m = realloc(ptr, size);
	if (m == NULL) {
		error->code = PlwErrorOutOfMem;
		snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "Can't realloc %ld bytes", size);
		return ptr;
	}
	return m;
}

void *PlwDup(const void *ptr, size_t size, PlwError *error) {
	void *res = PlwAlloc(size, error);
	if (PlwIsError(error)) {
		return NULL;
	}
	memcpy(res, ptr, size);
	return res;
}

char *PlwStrDup(const char *ptr, PlwError *error) {
	size_t len = strlen(ptr) + 1;
	char *res = PlwAlloc(len, error);
	if (PlwIsError(error)) {
		return NULL;
	}
	memcpy(res, ptr, len);
	return res;
}

char *PlwStrnDup(const char *ptr, size_t len, PlwError *error) {
	char *res = PlwAlloc(len + 1, error);
	if (PlwIsError(error)) {
		return NULL;
	}
	memcpy(res, ptr, len);
	res[len] = '\0';
	return res;
}

void PlwGrowArray(PlwInt addedCount, PlwInt itemSize, void *array, PlwInt *size, PlwInt *capacity, PlwError *error) {
	void *newPtr;
	PlwInt newCapacity;
	PlwInt newSize = *size + addedCount;
	if (newSize > *capacity) {
		newCapacity = *capacity * 2;
		if (newSize > newCapacity) {
			newCapacity = newSize;
		}
		newPtr = PlwRealloc(*((void **)(array)), newCapacity * itemSize, error);
		if (PlwIsError(error)) {
			return;
		}
		*((void **)(array)) = newPtr;
		*capacity = newCapacity;
	}
	*size = newSize;
}

