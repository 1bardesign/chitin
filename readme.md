# Chitin

Chitin is a javascript entity-component-system for game and interactive media development.

Chitin provides sane elementary building blocks for multimedia development, and provides workarounds and solutions for many common browser inconsistencies and inconveniences. It is designed to simplify getting a project off the ground while keeping things sustainable for longer development.

However, Chitin is in heavy development; widespread consumption is not recommended just yet!

# Architecture

Chitin is built on an Entity, Component, System ("ECS") architecture.

Entities are the fundamental "object" of Chitin. They can be thought of as "bags" of components, ready to be filled. They provide an interface and storage structure for adding, removing, and managing components - but do not perform logic on their own.

Components are structures that perform some behaviour for an entity. They are generally pretty specialised and minimalist but can be as complicated as a tilemap renderer or rigid body. Components can depend on one-another, but are meant to be largely composable. Entities will generally be made up of a handful of them or more. In particular, many of the built in components work together to provide "building blocks" that can be combined with minimal effort into many common types of "game object".

Systems are where components "live" - each type of component has a corresponding type of system. They manage the actual creation and destruction of components, as well as updating and rendering components as needed. All systems live in a global registry that is configured by the programmer - so custom systems and custom configurations of systems can be devised to best suit each project.

There are some auxilliary structures available to help manage things in real-world projects - things like state management, object grouping and media loading helpers provide a ready-made alternative to ad-hoc per-project solutions, while remaining open to you doing it yourself if you want to.

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

The short ballpark answer though, is: as long as you're not targeting mobile, fast enough to simulate at least a thousand semi-physical (world-colliding) animated particles as discrete entities (no dedicated SpecialParticleSystem) at 30fps on the low end; 60fps on any half-decent machine. However, also totally suitable for lighter stuff on mobile.

The even shorter answer is: check out the examples and see for yourself.

### Q: Why are you writing such old JS?

So that it runs in the browser without a transpiler, bundler, or whatever else. This means one less step between someone picking up the library and having it running.

### Q: Why all the globals?

This one depends on your perspective, but there's certainly a fair bit going on in the global namespace no matter how you measure it. I am open to cutting that down, but it's not a priority at the moment.

The main reason is that Chitin is intended to run your "main loop" and be a fundamental part of how you write your application. It's not a minor dependency you pull in for one function. I don't huge benefit to encapsulating such a library, especially as I'm aiming not to have a compilation step during development.

### Q: Why doesn't this ECS work like [some other ECS implementation]?

I've hesitated to call the architecture by the ECS moniker, as it seems to mean different things to different people, and there's a lot of "religious" discussion around it.

However, eradicating the terminology from the project proved difficult and counter-intuitive, so I've just tried to be open about how everything works.

The Chitin ECS was designed to map well to javascript. It tries to balance the performance required for games (especially on the web!) with ease of use required by javascript developers (especially those not confident writing their own framework!).

If you come from another ECS implementation, there might be some transitional aches and pains. Sorry about that.

### Q: What specifically might be different from some other ECS or Component-Oriented implementation I might have used?

There's less to be gained in js from the usual clever tricks to achieve better locality of reference, as we don't have any real control over where things end up in memory. More effort goes into avoiding needless iteration, reducing garbage collector pressure, and providing convenience to the programmer.

Entities do not update their components, and in fact are designed not to update at all.

Entities have no built-in behaviour other than component management structures and a property registry. Transforms are their own component (and entities can have zero, one, or many of them, just like any other component). There's no entity-side parent/child.

There is no global collection of all entities (unless you make one).

There is no component-existance bitmask, and an entity can have many instances of the same type of component.

Components (the built in ones at least) generally try to avoid going "through" the entity to find other data. They accept dependencies at creation time or through a setter. This makes the "as many of each component as you like" a lot easier. It is possible to access the entity though, which is handy when you are prototyping behaviours and your dependencies are in flux!

There is no packed-table data structure - though I'm investigating possible implementations of something like it that would make component creation and deletion faster! It's a different ball game with javascript though.

Systems (and components from that system) have string names which are used for creation, access, and destruction. JS is stringy; I've accepted that and tried to be very clear when and why an access fails (there's an alert if something's missing).

Systems can be created and destroyed while things are still running, so the mix of components available to entities can change on the fly. This allows only including and running what you need at any given time.

There are generic behaviour and state machine components for bolting ad-hoc behaviours onto an entity. The use of these is encouraged for throwaway code and prototyping, as it can easily be migrated to a dedicated component as and when needed. This is less rigid than a lot of documented component systems where every behaviour gets its own named, registered component.

# Built In Components

- __Behaviour__

	For any one-off behaviour per-entity. Technically everything "could" be a behaviour like this, but more well defined components are best split out to their own systems, and given names.

- __StateMachine__

	Handles state-machine-like behaviours - commonly used for global "gamestate" type entities and AI.

- __Transform__

	Handles a 2d point in space; has a position, velocity, acceleration, angle and angular velocity which are all integrated each frame. Used to position many other components.

- __Sprite__

	Handles rendering a 2d sprite in space. Depth sorted, culled interactively, supports alpha blending and x/y flipping on appropriately configured images.

- __Animation__

	Handles animating some property at a framerate independent of the game framerate - comes with a few specialisations to animate sprite frames.

- __Tilemap__

	Handles rendering and interacting with a regular 2d map of images. Commonly used for level rendering.

- __Shape__

	Comes in a few flavours (AABB and Circle at the moment) and describes some collidable geometry. Can be tested for overlap against other shapes, and collisions between them can be resolved.

# Code Style - Not strictly enforced

1TBS is used for some consistency with the rest of JS.

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

A list of tasks on the agenda - hopefully in constant flux! There are also minor `//todo:` notes scattered around the codebase to check up on from time to time.

### Major:

- demos (beetle themed)
	- animation (walking left and right, jumping, flipping)
	- platformer (demo level with doors, keys, pickups, enemy)
	- top-down (demo level with grass to cut, pickups, attacking, enemy, jumping over holes, multiple screens?)
	- particle (spawners, colliding vs tilemap and colliders, animations, rotating gibs, fade out)
	- collisions (group a vs group b; stacking stability; tilemap)
	- nbody (crafting specific behaviours)
- animation prefabs
	- framepos+framesize
	- offset animation
	- animate value?
- collision detection/resolution
	- line/capsule, SAT
	- vs advanced tilemap (tile -> shape mapping)
- parent/child system
	- transform linking with an offset
	- probably a flag for whether to apply parent rotation or not
- owner system
	- useful for damage, collision filtering and netcode
- verlet?
	- most non-physics systems only read/write pos, so it might be fairly compatible
	- transform
	- constraints
	- grouping to bodies
- tri renderer (webgl? would require reimplementation of a lot of the core stuff...)
- boilerplate networking infrastructure (messaging, multicast etc)

### Minor/Implementation:

- consider a more table-like structure for component storage to accelerate component addition/removal
- reusable acceleration structures for collisions, drawing etc
	- bucket grid
	- quadtree
