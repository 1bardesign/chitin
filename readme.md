# Chitin

Chitin is a javascript entity-component-system for game and interactive media development.

Chitin provides sane elementary building blocks for multimedia development, and provides workarounds and solutions for many common browser inconsistencies and inconveniences. It is designed to simplify getting a project off the ground while keeping things sustainable for longer development.

However, Chitin is in heavy development; widespread consumption is not recommended just yet!

# Architecture

Chitin is based on the Entity, Component, System ("ECS") architecture.

Entities are the fundamental "object" of Chitin. They can be thought of as "bags" of components, ready to be filled. They provide an interface and storage structure for adding, removing, and managing components but do not perform logic on their own.

Components are structures that perform some behaviour or store some data for an entity. They are generally pretty specialised or minimalist but can be as complicated as a tilemap renderer or rigid body. Components can depend on one-another, but are meant to be largely composable. Entities will generally be made up of a handful of them or more. In particular, many of the built in components work together to provide "building blocks" that can be combined with minimal effort into many common types of "game object".

Systems are where components "live" - each type of component has a corresponding type of system. They manage the actual creation and destruction of components, as well as updating and rendering components as needed. All systems live in a global registry set up before the project starts to run - custom systems and custom configurations of systems can be devised to best suit each project.

There are some auxilliary structures available to help manage things in real-world projects - things like state management, object grouping and media loading helpers provide an alternative to ad-hoc per-project solutions, while remaining open to you doing it yourself if you want to.

# Frequently and Infrequently Asked Questions

### Q: What's the fastest way to start a new chitin project?

This will be streamlined a lot once Chitin is ready for mass consumption! In particular, a combined (and optionally minified) build will be provided to cut down on the number of script tags.

However, to get started now:

- Create a new folder for your project. Be sure to give it a cool name!
- Create an `assets/` folder in there for your sprites, sounds and data files.
- Copy in the `js/` folder.
- Remove your copied `js/example/` folder as you wont need it.
- Copy `minimal.html` into your project; rename it as you see fit.
- Open it and ensure you see "hello chitin!".
- Open `main.js` and get coding!

### Q: How fast is Chitin?

As always with this question, that depends what you do with it: how much you want to simulate, whether you're running it in the browser or its own container, how performance-conscious you are writing your behaviours, whether you're doing other heavy lifting at the same time, and so on.

The short ballpark answer though, is: as long as you're not targeting mobile, fast enough to simulate at least a thousand colliding, animating particles as discrete entities (no dedicated SpecialParticleSystem) at 30fps on the low end; 60fps on any half-decent machine. However, also totally suitable for lighter stuff on mobile.

Check out the examples and see for yourself.

### Q: Why are you writing such old JS?

So that it runs in the browser without a transpiler, bundler, or whatever else. This means one less step between someone picking up the library and having it running.

### Q: Why all the globals?

This one depends on your perspective, but there's certainly a fair bit going on in the global namespace no matter how you measure it. I am open to cutting that down, but it's not a priority at the moment.

The main reason is that Chitin is intended to run your "main loop" and be a fundamental part of how you write your application. It's not a minor dependency you pull in for one function. I don't huge benefit to encapsulating such a library, especially as I'm aiming not to have a compilation step during development.

### Q: Why doesn't this ECS work like [some other ECS implementation]?

I've hesitated to call the architecture by the ECS moniker, as there's a lot of buzz and (often contradictory) preconception that comes with it at the moment.

However, eradicating the terminology from the project proved difficult and counter-intuitive, so I've just tried to be open about how everything works.

The Chitin ECS was designed to map well to javascript. It tries to balance the performance required for games (especially on the web!) with ease of use required by javascript developers (especially those not confident writing their own framework!).

If you come from another ECS implementation, there might be some transitional aches and pains. Sorry about that.

### Q: What specifically might be different from some other ECS or Component-Oriented implementation I might have used?

There's less to be gained in js from the usual clever tricks to achieve better locality of reference, as we don't have any real control over where things end up in memory. More effort goes into avoiding needless iteration, reducing garbage collector pressure, and providing convenience to the programmer.

Entities do not update their components, and in fact are designed not to update at all.

Entities have no built-in behaviour other than component management structures and a property registry. Transforms are their own component (and entities can have zero, one, or many of them, just like any other component). There's no entity-side parent/child.

There is no global collection of all entities (unless you make one).

There is no component-existance bitmask, and an entity can have many instances of the same type of component.

Components (the built in ones at least) generally try to avoid going "through" the entity to find other data. They accept dependencies at creation time or through a setter. This makes the "as many of each component as you like" a lot easier. It is possible to access the entity though, which is handy when prototyping behaviours and your dependencies are in flux!

There is no packed-table data structure - though I'm investigating possible implementations of something like it that would make component creation and deletion faster! It's a different ball game with javascript though.

Systems (and components from that system) have string names which are used for creation, access, and destruction. JS is stringy so I've accepted that and tried to be very clear when and why an access fails (there's an alert if something's missing).

There are generic data store, behaviour, and state machine components for bolting ad-hoc behaviours onto an entity. The use of these is encouraged for throwaway code and prototyping, as it can easily be migrated to a dedicated component as and when needed. This is less rigid than a lot of documented component systems where every behaviour gets its own named, registered component.

# Built In Components

- ### Behaviour

	For any one-off behaviour per-entity.

	Technically everything "could" be a behaviour like this, but more well defined components are best split out to their own systems, and given names.

- ### StateMachine

	Handles state-machine-like behaviours - commonly used for global "gamestate" type entities and AI.

- ### Transform

	Handles a 2d point in space; has a position, velocity, acceleration, angle and angular velocity which are all integrated each frame.

- ### Sprite

	Handles rendering a 2d sprite in space. depth sorted.

- ### Animation

	Handles animating some property at a framerate independent of the game framerate - comes with a few specialisations to animate sprite frames.

- ### Tilemap

	handles rendering a 2d map of images

# Code Style - Not strictly enforced

1TBS for some consistency with the rest of JS.

`UpperCamel` for types. `lower_slugs` for functions and variables.

Tabs on disk, 4 chars wide.

```
//syntax example
if(condition) {
	function_name();
} else {
	var variable_name = new TypeName();
}
```

# Project TODO

A list of tasks on the agenda - hopefully in constant flux! There are also minor `//todo:` notes scattered around the codebase.

### Major:

- animation - basic "fps" callback system? provide prefabs:
	- 1d frame
	- 2d frame
	- framepos
	- framepos+framesize
	- animate value?
- collision detection/resolution
	- between objects
	- vs tilemap
	- vs advanced tilemap (tile -> shape mapping)
- some sort of grouping system
	- especially for collision/overlap stuff
	- foreach-style ops
	- mass destruction
- parent/child system
	- common, transform linking
- owner system
	- useful for damage, collision filtering and netcode
- verlet?
	- most non-physics systems only read/write pos
	- might be fairly compatible
	- transform
	- constraints
	- grouping to bodies
- tri renderer
- networking infrastructure
- webgl renderer?

### Minor/Implementation:

- consider a more table-like structure for component storage to accelerate component addition/removal
- reusable acceleration structures for collisions, drawing etc
	- bucket grid
	- quadtree
