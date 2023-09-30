"use strict";
/******************************************************************************************************************************************

	Internals
	
	Code of internal functions

******************************************************************************************************************************************/

const PLW_IFUN_CREATE_STRING						= 0;
const PLW_IFUN_CONCAT_STRING                        = 1;
const PLW_IFUN_CREATE_BLOB                          = 2;
const PLW_IFUN_READ_BLOB                            = 3;
const PLW_IFUN_WRITE_BLOB                           = 4;
const PLW_IFUN_CONCAT_BLOB                          = 5;
const PLW_IFUN_GET_BLOB_MUTABLE_OFFSET				= 6;
const PLW_IFUN_GET_BLOB_SIZE                        = 7;
const PLW_IFUN_GET_BLOB_INDEX_OF_ITEM          		= 8;
const PLW_IFUN_SLICE_BLOB							= 9;
const PLW_IFUN_CREATE_BLOB_REPEAT_ITEM				= 10;
const PLW_IFUN_CREATE_EXCEPTION_HANDLER				= 11;
const PLW_IFUN_RAISE_EXCEPTION						= 12;
const PLW_IFUN_CREATE_GENERATOR						= 13;
const PLW_IFUN_GET_GENERATOR_NEXT_ITEM				= 14;
const PLW_IFUN_HAS_GENERATOR_ENDED					= 15;
const PLW_IFUN_YIELD_GENERATOR_ITEM					= 16;

const PLW_MAX_IFUN									= 16;

const PLW_IFUNS = [
	"CREATE_STRING",
	"CONCAT_STRING",
	"CREATE_BLOB",
	"READ_BLOB",
	"WRITE_BLOB",
	"CONCAT_BLOB",
	"GET_BLOB_MUTABLE_OFFSET",
	"GET_BLOB_SIZE",
	"GET_BLOB_INDEX_OF_ITEM",
	"SLICE_BLOB",
	"CREATE_BLOB_REPEAT_ITEM",
	"CREATE_EXCEPTION_HANDLER",
	"RAISE_EXCEPTION",
	"CREATE_GENERATOR",
	"GET_GENERATOR_NEXT_ITEM",
	"HAS_GENERATOR_ENDED",
	"YIELD_GENERATOR_ITEM"
];

