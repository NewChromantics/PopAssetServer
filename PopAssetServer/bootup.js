Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}

Pop.Include('PromiseQueue.js');
Pop.Include('PopEngineCommon/PopAssetServer.js');

const Window = new Pop.Gui.Window("Pop Asset Server");
const DebugLabel = new Pop.Gui.Label(Window,[0,0,900,900]);
DebugLabel.SetValue("Drop folders here");

const OldDebug = Pop.Debug;
const DebugLog = [];
const MaxDebugLogLength = 50;
Pop.Debug = function()
{
	const DebugString = [...arguments].join(',');
	DebugLog.splice(0,0,DebugString);
	DebugLog.splice(MaxDebugLogLength,DebugLog.length);
	
	//	update label
	Label.SetValue(DebugLog.join('\n'));
	
	//	print out stll
	//OldDebug( ...arguments );
	OldDebug( DebugString );
}

const AssetServer_Port = 8088;
const AssetServer_Directories = ['D:/PopKandinsky/Kandinsky'];

const AssetServer = new Pop.AssetServer(8088);

function OnListenToNewDirectory(Directory)
{
	AssetServer.ListenToDirectory(Directory);
}

AssetServer_Directories.forEach(OnListenToNewDirectory);


//	let user drag & drop folders
async function DragAndDropLoop()
{
	Pop.Debug("Drop folders on window to listen for changes");
	while (Window)
	{
		const Dropped = await Window.WaitForDragDrop();
		Pop.Debug(JSON.stringify(Dropped));
		Dropped.forEach(OnListenToNewDirectory);
		await Pop.Yield(100);
	}
}
DragAndDropLoop().then(Pop.Debug).catch(Pop.Debug);


