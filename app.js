const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();
// const date = require("./date.js");



const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static("public"));

mongoose.connect(process.env.MONGOOSE_URI, { useNewUrlParser:true }, { useUnifiedTopology: true });

const itemsSchema = {
  name: String
}

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const Item = mongoose.model ("item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your todo List!"
});



const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<--- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];



app.get("/", function(req, res) {

  Item.find({}, function(err, foundItem) {
    if (foundItem.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.")
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItem});
    }
  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function(err, foundList) {
    if(!err) {
      if(!foundList){
        // Create a new list
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // Show an exisiting list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

  const list = new List ({
    name: customListName,
    items: defaultItems
  });

  list.save();
});


app.post("/", function (req, res) {
  
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
  
});

app.post("/delete", function(req, res) {
  let checkedItemId = req.body.checkbox;
  checkedItemId = checkedItemId.trim();
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId, function(err) {
      if(!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId }}}, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});


app.get("/work", function(req, res) {
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});


app.listen(5000, function() {
  console.log("Server is running on port 5000.");
});