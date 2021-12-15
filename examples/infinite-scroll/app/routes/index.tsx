import { Link } from "remix";

export default function IndexRoute() {
  return (
    <div>
      <h1>Infinite Scroll Demo</h1>
      <p>
        There are two demos here. The first shows how to do this in a simple way
        that's pretty standard for this type of user experience you have around
        the web. The second is a bit more advanced but a much better user
        experience. Pick your preferred method.
      </p>
      <ul>
        <li>
          <Link to="/simple">Simple</Link>
        </li>
        <li>
          <Link to="/advanced">Advanced</Link>
        </li>
      </ul>
    </div>
  );
}
