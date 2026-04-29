#[macro_use]
pub mod macros;

pub mod core;

#[cfg(target_arch = "wasm32")]
pub mod wasm;
