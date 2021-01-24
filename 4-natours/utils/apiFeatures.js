class APIFeatures {
  // query - Queries from Model
  // queryString - req.query from URL
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // BUILD QUERY
    // 1) Filtering
    const queryObj = { ...this.queryString };

    // Because these are the functions that we want to apply, but
    // in MongoDB, they aren't properties in the documents.
    // So, we need to exclude them first in order to fetch data.
    const excludeFields = ['page', 'sort', 'limit', 'fields'];

    // delete the property from the obj
    excludeFields.forEach((el) => delete queryObj[el]);

    // 2) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    // matching the exact word of any of these gte, gt, lte, lt
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    // return the entire object
    return this;
  }

  sort() {
    // 3) Sorting
    if (this.queryString.sort) {
      // replacing ',' when there are multiple field.
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);

      // default sort
    } else {
      this.query = this.query.sort('-createdAt');
    }

    // return the entire object
    return this;
  }

  limit() {
    // 4) Field limiting
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      // projection
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  pagination() {
    // 5) Pagination
    // setting the default values
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // page=3&limit=10, 1-10 page1, 11-20, page2, 21-30 page3
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
