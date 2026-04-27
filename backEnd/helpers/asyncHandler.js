// asyncHandler.js
// Wraps async controller functions to
// handle errors automatically.
//
// Without asyncHandler we need try/catch
// in every single controller function:
//
// async function getShifts(req, res) {
//   try {
//     const shifts = await Shift.find();
//     res.json(shifts);
//   } catch (error) {
//     next(error); // must do this manually
//   }
// }
//
// With asyncHandler we just write:
//
// const getShifts = asyncHandler(
//   async (req, res) => {
//     const shifts = await Shift.find();
//     res.json(shifts);
//   }
// )
//
// Any error is automatically passed
// to the error middleware.

// asyncHandler - wraps an async function so errors go to next(err) automatically
// fn - the async controller function to wrap
// Returns a new function that Express can use as a route handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
