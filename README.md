**Project: UFO Pig Abduction - An Interactive 3D Scene**
This project showcases a dynamic 3D animation depicting a UFO abducting a pig, rendered using HTML and JavaScript with custom shader implementations. The scene integrates hierarchical object structures, real-time animation, camera controls, and custom shader effects to create a compelling visual narrative.

**Key Features & Technical Implementations**
1. Hierarchical Object Modeling & Animation
The scene incorporates at least one hierarchical object with three or more levels, demonstrating clear interaction through joint motion. Specifically, the alien character features a detailed arm hierarchy (body -> shoulder -> elbow -> lower arm -> hand -> fingers), where the lower arm's motion precisely illustrates the interaction between these levels. Additionally, the pig also utilizes a hierarchical structure, though its movement is more static to emphasize the abduction.

2. Immersive 360-Degree Camera Fly-Around
A 360-degree camera fly-around is implemented at the beginning of the scene. This effect uses lookAt() and setMV() to smoothly orbit the camera around a central point, providing a comprehensive view of the environment and setting the stage for the narrative.

3. Real-time Scene Execution
The entire scene is engineered to run in real-time, ensuring that one simulated second directly corresponds to one real second on adequately performing machines. This commitment to real-time rendering provides a fluid and responsive animation experience.

4. Advanced Shader Implementations
The project features significant development in shader programming, enhancing the rendering quality and visual appeal:

a) Fragment Shader for ADS Lighting
The Ambient, Diffuse, and Specular (ADS) lighting model, originally implemented as a vertex shader in the base code, has been successfully converted to a fragment shader. This allows for per-fragment lighting calculations, resulting in more accurate and visually appealing illumination across object surfaces.

b) Blinn-Phong Shading Model
Building upon the fragment shader, the Phong lighting model has been converted to Blinn-Phong. This modification offers a more realistic specular highlight by using a half-vector, contributing to improved surface appearance.

c) Custom Shader Effect: Dynamic Tinting
A custom shader effect has been designed from scratch and integrated into the scene. This effect applies a dynamic green tint to key objects, including the stars, the pig, and the UFO in Scene 1. This subtle yet noticeable tint serves to enhance the otherworldly atmosphere of the abduction, demonstrating a novel visual style beyond the base code and lab examples. While not as complex as some examples (e.g., spotlights or blur effects), this tinting effect significantly contributes to the scene's aesthetic. The inspiration for this tinting effect was drawn from the conceptual understanding of color manipulation within fragment shaders.

5. Dynamic Animation & Scene Complexity
The project demonstrates significant complexity through various animated elements and thoughtful scene design:

The pig is dynamically animated to lift as it is abducted, including a shrinking effect for realism.
The alien's hand and arm hierarchy are animated to perform the abduction action.
The UFO itself is animated with movements that correspond to the abduction sequence.
Environmental elements like the moon and stars are animated to enhance the scene's dynamism.
The alien character moves up and down within the UFO to interact with the pig.
6. Creative Storytelling & Scene Design
The project leverages creative scene design to tell a cohesive story:

Scene 1 establishes a familiar setting with the pig.
The transition to Scene 2 reveals the alien world, where the UFO originates.
The UFO then travels from Scene 2 back to Scene 1 to execute the abduction, creating a narrative flow. This storytelling approach enhances the visual experience and theme.
7. High Quality & Attention to Detail
Significant attention has been paid to the quality of the project, including:

Modeling quality for key objects.
Rendering quality enhanced by the custom shaders.
Precise motion control for animated elements, particularly evident in the abduction sequence involving shrinking and lifting.
Extensive use of variables allowed for fine-tuning of animations and visual effects.
8. Structured Programming Style
The codebase adheres to good programming practices, utilizing functions to encapsulate specific functionalities. This modular approach significantly improves code readability, maintainability, and organization, especially given the complexity of the scene and animations.
