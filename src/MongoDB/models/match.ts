import mongoose from 'mongoose';
import { MongoDB } from '..';
import { DeepPartial } from '../../utils/DeepPartial';
import { deepMerge } from '../../utils/DeepMerge';
import { deepCopy } from '../../utils/DeepCopy';
let Schema = mongoose.Schema;
let ObjectId = mongoose.Schema.Types.ObjectId;
const defaultMatchSchemaOptions: MongoDB.MatchSchemaOptions = {
  state: false,
  results: true,
  creationDate: true,
  finishDate: true,
  agents: true
}
const MatchSchemaCreator = (options: DeepPartial<MongoDB.MatchSchemaOptions> = {}) => {
  let schemaOptions: MongoDB.MatchSchemaOptions = 
    deepMerge(deepCopy(defaultMatchSchemaOptions), options);
  let schema = new Schema({
    name: String,
    id: {type: Schema.Types.Mixed, index: true, unique: true, required: true }
  });

  // TODO: This can be more streamlined. Perhaps in the MatchSchemaCreator we also store the kind of type they should be
  if (schemaOptions.creationDate) {
    schema.add({
      creationDate: { type: Schema.Types.Date }
    });
  }
  if (schemaOptions.finishDate) {
    schema.add({
      finishDate: { type: Schema.Types.Date }
    });
  }
  if (schemaOptions.results) {
    schema.add({
      results: Schema.Types.Mixed
    });
  }
  if (schemaOptions.state) {
    schema.add({
      state: Schema.Types.Mixed
    });
  }
  if (schemaOptions.agents) {
    schema.add({
      agents: Schema.Types.Mixed
    });
  }
  return schema;
};

export default MatchSchemaCreator;