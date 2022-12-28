#ifndef PLWCOMMON_H_
#define PLWCOMMON_H_

#include <stdlib.h>
#include <stdint.h>

#define PLW_ERROR_MESSAGE_MAX 512

typedef int64_t PlwInt;
typedef PlwInt PlwBoolean;
typedef double PlwFloat;

typedef union PlwWord {
	PlwInt i;
	PlwFloat f;
} PlwWord;

#define PlwTrue 1
#define PlwFalse 0

typedef struct PlwErrorStruct {
	const char *code;
	char message[PLW_ERROR_MESSAGE_MAX];
} PlwError;

#define PlwError_Init(e) do { (e)->code = NULL; (e)->message[0] = '\0'; } while(0)
#define PlwIsError(e) ((e)->code != NULL)

extern const char *PlwErrorOutOfMem;

void *PlwAlloc(size_t size, PlwError *error);

void PlwFree(void *ptr);

void *PlwRealloc(void *ptr, size_t size, PlwError *error);

void *PlwDup(const void *ptr, size_t  size, PlwError *error);

char *PlwStrDup(const char *ptr, PlwError *error);

char *PlwStrnDup(const char *ptr, size_t size, PlwError *error);

void PlwGrowArray(PlwInt addedCount, PlwInt itemSize, void *array, PlwInt *size, PlwInt *capacity, PlwError *error);

#endif
