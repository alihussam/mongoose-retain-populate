import { Schema, Query, HydratedDocument } from "mongoose";

/**
 * Mongoose plugin that retains original reference IDs alongside populated data in toJSON/toObject output.
 * 
 * @param schema - The Mongoose schema to apply the plugin to.
 */
export function retainPopulatePlugin(schema: Schema): void {
  /**
   * Wraps existing `.toObject()` and `.toJSON()` transform functions to include both reference IDs and populated data.
   * Preserves any custom transforms while adding our own functionality.
   * 
   * @param originalTransform - The schema's existing transform function (if any)
   * @returns A new transform function that includes both original and populated data
   */
  function wrapTransform<T>(
    originalTransform?: (
      doc: HydratedDocument<T>,
      ret: Record<string, any>
    ) => Record<string, any> | void
  ) {
    return function (
      doc: HydratedDocument<T>,
      ret: Record<string, any>
    ): Record<string, any> {
      // Apply the original transform function if it exists
      if (originalTransform) {
        const transformedRet = originalTransform(doc, ret);

        // If the original function returns a value, use it
        // Otherwise, expect that the original function modified the ret object
        if (transformedRet !== undefined) {
          ret = transformedRet;
        }
      }

      // Only process if the document has populated fields
      if ((doc as any).$__.populated) {
        Object.keys((doc as any).$__.populated).forEach((field: string) => {
          const originalValue = (doc as any).$__.populated[field]?.value; // Original ID(s)
          const populatedData = ret[field]; // Populated document(s)

          if (Array.isArray(populatedData)) {
            // For array references (one-to-many)
            ret[`${field}`] = originalValue;            // Keep original IDs array
            ret[`${field}_populated`] = populatedData;  // Store populated documents
          } else {
            // For single references (one-to-one)
            ret[`${field}`] = originalValue;            // Keep original ID
            ret[`${field}_populated`] = populatedData;  // Store populated document
          }
        });
      }

      return ret;
    };
  }

  /**
   * In Mongoose version 7+, `schema.options` is not explicitly defined in the type,
   * but it exists at runtime. Cast the schema to access options.
   */
  const schemaWithOptions = schema as Schema & { options: Record<string, any> };

  // Initialize transform options if they don't exist
  schemaWithOptions.options.toObject = schemaWithOptions.options.toObject || {};
  schemaWithOptions.options.toJSON = schemaWithOptions.options.toJSON || {};

  // Apply our transform wrapper while preserving existing transforms
  schemaWithOptions.options.toObject.transform = wrapTransform(
    schemaWithOptions.options.toObject.transform
  );
  schemaWithOptions.options.toJSON.transform = wrapTransform(
    schemaWithOptions.options.toJSON.transform
  );
}
