export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Changelog</h1>
        <p className="mt-2 text-sm text-gray-500">
          Features and improvements across each version of the suit, and the events where they first appeared!
        </p>
      </header>

      <nav className="mb-8">
        <ul className="flex flex-wrap gap-2 text-sm">
          <li>
            <a href="#v1-0" className="rounded bg-blue-600 text-white px-2 py-1 hover:bg-black">V1.0</a>
          </li>
          <li>
            <a href="#v1-1" className="rounded bg-blue-600 text-white px-2 py-1 hover:bg-black">V1.1</a>
          </li>
          <li>
            <a href="#v1-2" className="rounded bg-blue-600 text-white px-2 py-1 hover:bg-black">V1.2</a>
          </li>
          <li>
            <a href="#v1-3" className="rounded bg-blue-600 text-white px-2 py-1 hover:bg-black">V1.3</a>
          </li>
        </ul>
      </nav>

      <section id="v1-0" className="mb-10">
        <p className="text-2xl font-semibold">V1.0 - BFF Heroes and Villains</p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>⚙️ Digital eyes with various animated expressions, realistic control and with physics</li>
          <li>⚙️ Real-time eye tracking and facial expression classification (optimized method developed by me)</li>
          <li>⚙️ Mouth LEDs</li>
          <li>⚙️ Real-time voice changer with inumerous filters</li>
          <li>⚙️ Ability to receive and play audio messages</li>
          <li>⚙️ Ability to play music from Spotify</li>
          <li>⚙️ Soundboard</li>
          <li>⚙️ Sound effects play on key actions and states</li>
          <li>⚙️ Custom voice-commanded assistant</li>
          <li>⚙️ Telegram bot for remote control, with graphical interface that can be installed as app</li>
          <li>⚙️ Battery charge for up to 6 hours of nonstop use</li>
          <li>⚙️ Head system is magnetically coupled, very easy removal for washing</li>
          <li>⚙️ Component box with fake control panel</li>
        </ul>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>🐾 Digitigrade full body</li>
          <li>🐾 Height-increasing feetpaws</li>
          <li>🐾 3D printed head base with counterweight hook</li>
          <li>🐾 Moving jaw with bearing and springs</li>
          <li>🐾 Optic fiber whiskers</li>
          <li>🐾 Big neck fluff</li>
          <li>🐾 16 glow-in-the-dark claws</li>
          <li>🐾 Large paws with finger holes</li>
          <li>🐾 Magnetic villain mustache</li>
        </ul>
        <div className="mt-4">
          <a href="#top" className="text-sm text-blue-600 hover:underline">Back to top</a>
        </div>
      </section>

      <section id="v1-1" className="mb-10">
        <p className="text-2xl font-semibold">V1.1 - Megaplex House of Pounce</p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>⚙️ Suit now plays mechanical/robot noises randomly</li>
          <li>⚙️ Glitch eye effects now play glitch sounds</li>
          <li>⚙️ Fixed bug that caused app commands to not be registered</li>
          <li>⚙️ Reworked Spotify control (easier to use)</li>
          <li>⚙️ Reworked main app menu</li>
          <li>⚙️ Voices and sounds effects can now be searched by name</li>
          <li>⚙️ Voicemod V2 upgraded to V3</li>
          <li>⚙️ New acrylic cover for component box</li>
          <li>⚙️ New emergency giroflex light accessory</li>
          <li>⚙️ Location tracker (similar to Apple AirTag but Android compatible)</li>
        </ul>
        <div className="mt-4">
          <a href="#top" className="text-sm text-blue-600 hover:underline">Back to top</a>
        </div>
      </section>

      <section id="v1-2" className="mb-10">
        <p className="text-2xl font-semibold">V1.2 - FurSMeet D&D</p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>⚙️ Any image or video can now be uploaded from the app and instantly played on the eyes, with sound</li>
          <li>⚙️ Eyes are now displayed in 60 frames per second (was 30)</li>
          <li>⚙️ Real-time expression classification from speech, using my EmoTiny package</li>
          <li>⚙️ More reliable eyes control and expression switching, using macro commands</li>
          <li>⚙️ New voice assistant. It is now faster and interruptible, has a better voice, can search the internet and can call functions to control the suit autonomously</li>
          <li>⚙️ QR code now goes straight to the app, no need to open the bot first</li>
          <li>⚙️ Fixed faulty HDMI cable</li>
        </ul>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>🐾 Sturdier jaw hinges made of PETG (more resistant to vibration/shear) and metal pin</li>
          <li>🐾 Secondary belt for better fixation of component box</li>
        </ul>
        <div className="mt-4">
          <a href="#top" className="text-sm text-blue-600 hover:underline">Back to top</a>
        </div>
      </section>

      <section id="v1-3" className="mb-10">
        <p className="text-2xl font-semibold">V1.3 - FURCAMP Legacy of the Corsairs</p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>⚙️ New, more resistant PVC-based component box</li>
          <li>⚙️ Timer-based auto switch from manual to automatic expression</li>
          <li>⚙️ New sound effects, and shortened ones that were too long</li>
          <li>⚙️ Bug fixes</li>
        </ul>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>🐾 Better moving jaw sensitivity with stronger springs</li>
          <li>🐾 Better mustache magnetic attachment</li>
        </ul>
        <div className="mt-4">
          <a href="#top" className="text-sm text-blue-600 hover:underline">Back to top</a>
        </div>
      </section>
    </div>
  );
}