# 🔌 mongoose-retain-populate

A Mongoose plugin that retains the original reference ID(s) alongside populated documents when using `toJSON()` or `toObject()`.

## 📦 Installation

```bash
npm install mongoose-retain-populate
```

## ✨ Features

- Preserves original reference IDs when converting populated documents to plain objects
- Stores populated data in separate fields with `_populated` suffix
- Works with both single references and arrays
- Preserves and works with custom transform functions
- Compatible with Mongoose 6+

## 🚀 Usage

```typescript
import { Schema } from 'mongoose';
import { retainPopulatePlugin } from 'mongoose-retain-populate';

// Create your schema
const userSchema = new Schema({
  name: String,
  profile: { type: Schema.Types.ObjectId, ref: 'Profile' },
  posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }]
});

// Apply the plugin
userSchema.plugin(retainPopulatePlugin);

// When you populate and convert to plain object, you'll get both IDs and populated data
const user = await User.findOne().populate('profile').populate('posts');
const plainUser = user.toJSON();  // or user.toObject()

// Single reference example
console.log(plainUser.profile);           // Original ObjectId
console.log(plainUser.profile_populated); // Populated profile document

// Array reference example
console.log(plainUser.posts);             // Array of original ObjectIds
console.log(plainUser.posts_populated);   // Array of populated post documents
```

## 🔍 How it Works

When converting a populated document to a plain object using `toJSON()` or `toObject()`:

- 🔗 Single references: 
  - Original ID is kept in `fieldName`
  - Populated data is stored in `fieldName_populated`
- 📚 Array references:
  - Original IDs are kept in `fieldName`
  - Populated data is stored in `fieldName_populated`

## 🛠️ Custom Transform Functions

The plugin preserves any existing transform functions:

```typescript
const userSchema = new Schema({
  name: String,
  posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }]
}, {
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

userSchema.plugin(retainPopulatePlugin);
// Both the custom transform and the plugin's transform will be applied
```

## 🎯 Why Choose This Package?

- No repetitive transform functions required for each model
- Apply once as a plugin, works automatically for all populated fields
- No boilerplate code in your models

### Alternate Implementation Methods

- **Manual Field Copying**: Repetitive code, easy to forget, manual tracking needed, error-prone with nested populations
    ```typescript
    // Need to do this for every query
    const user = await User.findOne().populate(['profile', 'posts']);
    const result = user.toJSON();
    result.profileId = user.profile._id;
    result.postsIds = user.posts.map(post => post._id);
    ```

- **Custom Virtual Fields**: Setup required for each field, maintenance burden, complex array handling
    ```typescript
    // Need to define virtuals for each reference field
    const userSchema = new Schema({
        profile: { type: Schema.Types.ObjectId, ref: 'Profile' }
    });

    userSchema.virtual('profileId').get(function() {
        return this.profile._id || this.profile;
    });
    ```

- **Custom Transform Functions**: Updates needed for new fields, complex nested populations, code duplication
    ```typescript
    // Need to handle each populated field manually
    const userSchema = new Schema({
    profile: { type: Schema.Types.ObjectId, ref: 'Profile' }
    }, {
    toJSON: {
        transform: function(doc, ret) {
        if (doc.populated('profile')) {
                ret.profileId = doc.profile._id;
            }
            return ret;
        }
    }
    });
    ```

- **Custom Population Method**: Inconsistent with mongoose patterns, potential middleware conflicts, difficult maintenance
    ```typescript
    // Inconsistent with mongoose patterns
    userSchema.methods.populateAndRetain = async function(path) {
        const originalValue = this[path];
        await this.populate(path);
        this[`${path}Id`] = originalValue;
        return this;
    };
    ```


## 📄 License

MIT
