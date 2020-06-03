Pop.Include = function(Filename)
{
	const Source = Pop.LoadFileAsString(Filename);
	return Pop.CompileAndRun( Source, Filename );
}

Pop.Include('PopEngineCommon/PopApi.js');
Pop.Include('PopEngineCommon/PopAssetServer.js');


function StringSplitByLength(Str,ChunkLength)
{
	ChunkLength = Math.max(2,ChunkLength);
	const Chunks = [];
	for ( let i=0;	i<Str.length;	i+=ChunkLength)
		Chunks.push( Str.substring(i,i+ChunkLength) );
	return Chunks;
}

function RedirectDebugToLabel(Label)
{
	const OldDebug = Pop.Debug;
	const DebugLog = [];
	const MaxDebugLogLength = 100;
	const MaxDebugLineLength = 100;
	Pop.Debug = function()
	{
		//	temp fix; auto-split lines to stop label clipping debug
		const Args = [...arguments];
		const DebugString = Args.join(',');

		const LineChunks = StringSplitByLength(DebugString,MaxDebugLineLength);
		DebugLog.splice(0,0,...LineChunks);
		DebugLog.splice(MaxDebugLogLength,DebugLog.length);

		//	update label
		DebugLabel.SetValue(DebugLog.join('\n'));
		
		//	print out stll
		//OldDebug( ...arguments );
		OldDebug( DebugString );
	}
}


//	todo: this app should run even if creating a window fails
const Window = new Pop.Gui.Window("Pop Asset Server");
const DebugLabel = new Pop.Gui.Label(Window,[0,0,900,900]);
DebugLabel.SetValue("Drop folders here");
RedirectDebugToLabel(DebugLabel);

//	let user drag & drop folders
async function DragAndDropLoop()
{
	Pop.Debug("Drop folders on window to listen for changes");
	while (Window)
	{
		const Dropped = await Window.WaitForDragDrop();
		Pop.Debug("Dropped",JSON.stringify(Dropped));
		Dropped.forEach(OnListenToNewDirectory);
		await Pop.Yield(100);
	}
}
Pop.Debug("hello");
DragAndDropLoop().then(Pop.Debug).catch(Pop.Debug);



//	run server
const AssetServerPortCount = 10;
const AssetServer_Ports = [...Array(AssetServerPortCount)].map( (v,i) => 0xF11E + i );	//	generate X ports from F11E (file)
const AssetServer_Directories = [];
const AssetServer = new Pop.AssetServer(AssetServer_Ports);
const ListenDirectorySavedFilename = 'ListenDirectories.json';

function OnListenToNewDirectory(Directory)
{
	AssetServer_Directories.push(Directory);
	AssetServer.ListenToDirectory(Directory);
	Pop.Debug(`Listening for changes in ${Directory}`);
	
	try
	{
		SaveListenDirectoryList();
	}
	catch(e)
	{
		Pop.Debug(`Error saving listening directory list ${e}`);
	}
}

function SaveListenDirectoryList()
{
	const Json = JSON.stringify(AssetServer_Directories,null,'\t');
	Pop.WriteStringToFile(ListenDirectorySavedFilename,Json);
}

function LoadListenDirectoryList()
{
	try
	{
		const Contents = Pop.LoadFileAsString(ListenDirectorySavedFilename);
		const Filenames = JSON.parse(Contents);
		Filenames.forEach(OnListenToNewDirectory);
	}
	catch(e)
	{
		Pop.Debug(`Failed to load directory list ${e}`);
	}
}


LoadListenDirectoryList();



