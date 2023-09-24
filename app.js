const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

dotenv.config();
mongoose
  .connect(
    process.env.MONGODB_URI, // Use the environment variable here
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      w: "majority",
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

const todoschema = mongoose.Schema({
  name: String,
});

// The rest of your app code goes here

const listSchema = {
  name: String,
  items: [todoschema],
};

const List = mongoose.model("List", listSchema);

const Item = mongoose.model("item", todoschema);

const Item1 = new Item({
  name: "Type here",
});

const defaultItem = [Item1];

app.get("/", function (req, res) {
  // let day = date.getdate();
  Item.find().then((foundItem) => {
    if (foundItem.length === 0) {
      Item.insertMany(defaultItem)
        .then(() => {
          console.log("success");
        })
        .catch((err) => {
          console.log(err);
        });
      res.redirect("/");
    } else {
      res.render("lists", { listitem: "Today", newitem: foundItem });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newitem;
  const listname = req.body.button;
  // let day = date.getdate();
  const newitembyuse = new Item({
    name: itemName,
  });
  if (listname === "Today") {
    newitembyuse.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listname })
      .then((foundlist) => {
        foundlist.items.push(newitembyuse);
        foundlist.save();
        res.redirect("/" + foundlist.name);
      })
      .catch((err) => {
        console.error(err);
      });
  }
});

app.post("/delete", function (req, res) {
  const checked_id = req.body.checkbox;
  const listname = req.body.hidden;
  if (listname === "Today") {
    Item.findByIdAndRemove(checked_id)
      .then(() => {
        console.log("successfully deleted");
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listname },
      { $pull: { items: { _id: checked_id } } }
    )
      .then(() => {
        res.redirect("/" + listname);
      })
      .catch((err) => {
        console.err(err);
      });
  }
});
app.get("/:custom", function (req, res) {
  const customlistname = _.capitalize(req.params.custom);
  List.findOne({ name: customlistname })
    .then((founditem) => {
      if (!founditem) {
        const list = new List({
          name: customlistname,
          items: defaultItem,
        });
        list.save();
        res.redirect("/" + customlistname);
      } else {
        res.render("lists", {
          listitem: founditem.name,
          newitem: founditem.items,
        });
      }
    })
    .catch((err) => {
      console.error(err);
    });
});
const PORT = process.env.PORT || 3000; // Use uppercase "PORT"

app.listen(PORT, function () {
  console.log("Server is running on port " + PORT);
});
